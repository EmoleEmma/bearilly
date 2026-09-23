import { KIND_LABEL, type Kind, type RawQuestion } from './types'

export type PasteWhat = 'lesson' | 'key_points' | 'resources' | 'summary' | 'revision' | 'questions'

export const PASTE_LABEL: Record<PasteWhat, string> = {
  lesson: 'Lesson',
  key_points: 'Key Points',
  resources: 'Resources',
  summary: 'Summary',
  revision: 'Revision notes',
  questions: 'Questions',
}

type Draft = {
  q: string[]
  opts: [string[], string[], string[], string[]]
  answer: string
  difficulty: string
  expl: string[]
  field: 'q' | 0 | 1 | 2 | 3 | 'expl'
}

const Q_START = /^\s*Q(?:uestion)?\s*\d*\s*[:.)]\s*(.*)$/i
const OPT = /^\s*\(?([A-Da-d])\s*[).:]\s*(.*)$/
const ANS = /^\s*(?:correct\s+)?answer\s*[:\-]\s*\(?\s*([A-Da-d])\b.*$/i
const DIF = /^\s*difficulty\s*[:\-]\s*([A-Za-z]+)/i
const EXP = /^\s*(?:explanation|rationale|solution)\s*[:\-]\s*(.*)$/i

const newDraft = (first: string): Draft => ({
  q: [first], opts: [[], [], [], []], answer: '', difficulty: '', expl: [], field: 'q',
})

/**
 * Reads the format the "Copy prompt for AI" button asks the AI to use:
 *   Q: ...   A) ...  B) ...  C) ...  D) ...   Answer: B   Difficulty: easy   Explanation: ...
 * Row numbers are simply 1, 2, 3... (the question's position in the pasted text).
 */
export function parsePastedQuestions(text: string): Omit<RawQuestion, 'subject' | 'topic' | 'set'>[] {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\*\*/g, '').replace(/^#+\s*/gm, '').split('\n')
  const drafts: Draft[] = []
  let cur: Draft | null = null

  for (const line of lines) {
    if (!line.trim()) continue
    const qs = Q_START.exec(line)
    if (qs) { cur = newDraft(qs[1].trim()); drafts.push(cur); continue }
    if (!cur) continue

    const ans = ANS.exec(line)
    if (ans) { cur.answer = ans[1].toUpperCase(); cur.field = 'expl'; continue }
    const dif = DIF.exec(line)
    if (dif) { cur.difficulty = dif[1]; continue }
    const exp = EXP.exec(line)
    if (exp) { cur.expl = [exp[1].trim()]; cur.field = 'expl'; continue }
    const opt = OPT.exec(line)
    if (opt && cur.field !== 'expl') {
      const i = 'ABCD'.indexOf(opt[1].toUpperCase()) as 0 | 1 | 2 | 3
      cur.opts[i] = [opt[2].trim()]
      cur.field = i
      continue
    }
    // continuation of whatever we were writing
    if (cur.field === 'q') cur.q.push(line.trim())
    else if (cur.field === 'expl') cur.expl.push(line.trim())
    else cur.opts[cur.field].push(line.trim())
  }

  return drafts.map((d, i) => ({
    row: i + 1,
    difficulty: d.difficulty,
    question: d.q.join(' ').trim(),
    options: d.opts.map(o => o.join(' ').trim()) as [string, string, string, string],
    answer: d.answer,
    explanation: d.expl.join(' ').trim(),
  }))
}

export function buildAiPrompt(opts: {
  what: PasteWhat
  subject: string
  topic: string
  kind?: Kind
  count?: number
}): string {
  const { what, subject, topic } = opts
  const head =
    `You are writing content for "Bearilly", an online learning platform.\n` +
    `Subject: ${subject || '[subject]'}\nTopic: ${topic || '[topic]'}\n\n`

  if (what === 'questions') {
    const kind = opts.kind ?? 'practice'
    const count = opts.count ?? (kind === 'practice' ? 20 : 5)
    const mix =
      kind === 'practice'
        ? `Difficulty mix: 5 easy, 10 medium, 5 hard (for 20 questions).\n`
        : kind === 'application_test'
          ? `Each question is a short real-life situation, e.g. "A client asks you to... What do you do?".\n`
          : kind === 'mastery_test'
            ? `These are harder questions that prove the student truly understands the topic.\n`
            : ''
    return (
      head +
      `Task: write ${count} multiple-choice questions for the ${KIND_LABEL[kind]}.\n\n` +
      `Rules:\n- Exactly 4 options (A, B, C, D) and exactly one correct answer.\n` +
      `- Wrong options must be believable, not silly.\n- Vary which letter is correct.\n` +
      `- Every question needs a difficulty and a short explanation of why the answer is correct.\n` +
      mix +
      `\nReply with ONLY the questions in exactly this format. No introduction, no closing text:\n\n` +
      `Q: <question>\nA) <option>\nB) <option>\nC) <option>\nD) <option>\nAnswer: <A, B, C or D>\n` +
      `Difficulty: <easy, medium or hard>\nExplanation: <one or two sentences>\n\n` +
      `(leave one blank line between questions)`
    )
  }

  const tasks: Record<Exclude<PasteWhat, 'questions'>, string> = {
    lesson:
      'Write the lesson text: 400 to 1,200 words, plain text, short paragraphs, clear examples. No markdown symbols, no title, no introduction.',
    key_points:
      'Write 5 to 8 key points a student must remember. One per line, each under 20 words. No numbering and no bullets.',
    resources:
      'Suggest up to 5 supporting resources, one per line, exactly like this: Title | https://link\n' +
      'ONLY include links you are certain exist and are free to open. Never invent a link. If unsure, give fewer.',
    summary: 'Write a summary of this topic in 3 to 5 sentences, plain text.',
    revision:
      'Write compact revision notes: 6 to 10 lines, each like "Term - short meaning", suitable for last-minute revision.',
  }
  return head + `Task: ${tasks[what]}\n\nReply with ONLY the content itself, nothing else.`
}
