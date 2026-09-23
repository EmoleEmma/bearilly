import {
  KINDS, KIND_LABEL,
  type Difficulty, type ImportContext, type ImportPayload, type ImportSummary,
  type Issue, type Kind, type RawImport, type ValidationResult,
} from './types'
import { clean, parseOrder, slugify, toLines, topicKey } from './text'

export function parseKind(v: string): Kind | null {
  const t = clean(v).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  const map: Record<string, Kind> = {
    practice: 'practice', 'practice questions': 'practice', 'practice question': 'practice',
    'knowledge check': 'knowledge_check',
    'application test': 'application_test',
    'mastery test': 'mastery_test',
    'mock exam': 'mock_exam', mock: 'mock_exam', 'mock examination': 'mock_exam',
  }
  return map[t] ?? null
}

function parseDifficulty(v: string): Difficulty | null | 'bad' {
  const t = clean(v).toLowerCase()
  if (!t) return null
  if (t === 'easy') return 'easy'
  if (t === 'medium' || t === 'moderate') return 'medium'
  if (t === 'hard' || t === 'difficult') return 'hard'
  return 'bad'
}

function parseAnswerLetter(v: string): number | null {
  const m = /^(?:option\s+)?\(?\s*([A-Da-d])\s*[).:]?$/i.exec(clean(v))
  return m ? 'ABCD'.indexOf(m[1].toUpperCase()) : null
}

export function groupKey(topicKeyOrNull: string | null, kind: Kind): string {
  return `${topicKeyOrNull ?? 'mock'}#${kind}`
}

export const PRACTICE_RULE = { total: 20, easy: 5, medium: 10, hard: 5 }
export const MOCK_TOTAL = 100

type Group = { label: string; kind: Kind; total: number; easy: number; medium: number; hard: number }

export function validateImport(raw: RawImport, ctx: ImportContext): ValidationResult {
  const issues: Issue[] = []
  const L = raw.labels
  const add = (level: Issue['level'], sheet: string, row: number | undefined, message: string) =>
    issues.push({ level, sheet, row, message })
  const err = (sheet: string, row: number | undefined, m: string) => add('error', sheet, row, m)
  const warn = (sheet: string, row: number | undefined, m: string) => add('warning', sheet, row, m)

  const payload: ImportPayload = { subjects: [], topics: [], questions: [] }

  // ── Syllabus ──────────────────────────────────────────────
  if (raw.syllabus) {
    const overview = clean(raw.syllabus.overview)
    const audience = clean(raw.syllabus.audience)
    const objectives = toLines(raw.syllabus.objectives)
    if (overview || audience || objectives.length) {
      const text = [overview, audience ? `Who it's for: ${audience}` : ''].filter(Boolean).join('\n\n')
      payload.syllabus = { overview: text || null, objectives }
    }
  }

  // ── Subjects ──────────────────────────────────────────────
  const fileSubjects = new Set<string>()
  const seenSubject = new Map<string, number>()
  for (const s of raw.subjects) {
    const name = clean(s.name)
    if (!name) { err(L.subjects, s.row, 'Subject name is empty.'); continue }
    const slug = slugify(name)
    if (!slug) { err(L.subjects, s.row, `Subject "${name}" needs letters or numbers.`); continue }
    if (seenSubject.has(slug)) {
      err(L.subjects, s.row, `Subject "${name}" appears twice (also on row ${seenSubject.get(slug)}).`)
      continue
    }
    seenSubject.set(slug, s.row)
    fileSubjects.add(slug)
    const order = parseOrder(s.order)
    if (order === 'bad') { err(L.subjects, s.row, `Order "${s.order}" must be a whole number like 1, 2, 3.`); continue }
    payload.subjects.push({ name, description: clean(s.description) || null, order })
  }
  const subjectKnown = (slug: string) => fileSubjects.has(slug) || ctx.existingSubjectSlugs.has(slug)

  // ── Topics ────────────────────────────────────────────────
  const fileTopics = new Map<string, string>() // key -> label
  const seenTopic = new Map<string, number>()
  for (const t of raw.topics) {
    const subject = clean(t.subject)
    const title = clean(t.title)
    if (!subject) { err(L.topics, t.row, 'Subject is empty.'); continue }
    if (!title) { err(L.topics, t.row, 'Topic title is empty.'); continue }
    const sslug = slugify(subject)
    if (!subjectKnown(sslug)) {
      err(L.topics, t.row, `Subject "${subject}" is not on the ${L.subjects} sheet and does not exist yet. Check the spelling.`)
      continue
    }
    const key = topicKey(subject, title)
    if (seenTopic.has(key)) {
      err(L.topics, t.row, `Topic "${title}" appears twice in "${subject}" (also on row ${seenTopic.get(key)}).`)
      continue
    }
    seenTopic.set(key, t.row)
    fileTopics.set(key, `${subject} > ${title}`)

    const exists = ctx.existingTopicKeys.has(key)
    if (t.patch && !exists) {
      err(L.topics, t.row, `Topic "${title}" does not exist in "${subject}", so there is nothing to add to.`)
      continue
    }
    const lesson = clean(t.lesson)
    if (!t.patch && !lesson && !exists) {
      err(L.topics, t.row, `"${title}" is a new topic, so the Lesson text cannot be empty.`)
      continue
    }
    const order = parseOrder(t.order)
    if (order === 'bad') { err(L.topics, t.row, `Order "${t.order}" must be a whole number like 1, 2, 3.`); continue }

    const resourceLines = toLines(t.resources)
    for (const line of resourceLines) {
      const parts = line.split('|').map(p => p.trim())
      const url = parts[parts.length - 1]
      if (parts.length < 2 || !parts[0] || !url) {
        warn(L.topics, t.row, `Resource "${line.slice(0, 60)}" should look like: Title | https://link`)
      } else if (!/^https?:\/\/\S+$/i.test(url)) {
        warn(L.topics, t.row, `The link for "${parts[0]}" should start with http:// or https://`)
      }
    }
    const keyPoints = toLines(t.keyPoints)

    payload.topics.push({
      subject, title, order,
      lesson: lesson || null,
      key_points: keyPoints.length ? keyPoints.join('\n') : null,
      resources: resourceLines.length ? resourceLines.join('\n') : null,
      summary: clean(t.summary) || null,
      revision: clean(t.revision) || null,
    })
  }
  const topicKnown = (key: string) => fileTopics.has(key) || ctx.existingTopicKeys.has(key)

  // ── Questions ─────────────────────────────────────────────
  const groups = new Map<string, Group>()
  const byKind = Object.fromEntries(KINDS.map(k => [k, 0])) as Record<Kind, number>
  const seenText = new Map<string, number>()

  for (const q of raw.questions) {
    if (!clean(q.set)) { err(L.questions, q.row, 'Set is empty. Use Practice, Knowledge Check, Application Test, Mastery Test or Mock Exam.'); continue }
    const kind = parseKind(q.set)
    if (!kind) {
      err(L.questions, q.row, `Set "${clean(q.set)}" is not recognised. Use Practice, Knowledge Check, Application Test, Mastery Test or Mock Exam.`)
      continue
    }

    const subject = clean(q.subject)
    const topic = clean(q.topic)
    let tKey: string | null = null
    let label = 'Mock Exam'
    if (kind === 'mock_exam') {
      if (subject || topic) warn(L.questions, q.row, 'Subject and Topic are ignored for Mock Exam questions (the mock covers the whole track).')
    } else {
      if (!subject || !topic) { err(L.questions, q.row, 'Subject and Topic are required (only Mock Exam questions may leave them empty).'); continue }
      tKey = topicKey(subject, topic)
      label = `${subject} > ${topic}`
      if (!topicKnown(tKey)) {
        err(L.questions, q.row, `Topic "${topic}" was not found in subject "${subject}". Check the spelling against the ${L.topics} sheet.`)
        continue
      }
    }

    const text = clean(q.question)
    if (!text) { err(L.questions, q.row, 'Question text is empty.'); continue }

    const opts = q.options.map(clean)
    const filled = opts.filter(Boolean)
    if (filled.length < 2) { err(L.questions, q.row, 'At least two answer options are needed.'); continue }
    const lower = filled.map(o => o.toLowerCase())
    if (new Set(lower).size !== lower.length) { err(L.questions, q.row, 'Two of the answer options are identical.'); continue }

    const idx = parseAnswerLetter(q.answer)
    if (idx === null) {
      err(L.questions, q.row, `Answer must be a single letter A, B, C or D (found "${clean(q.answer)}").`)
      continue
    }
    if (!opts[idx]) { err(L.questions, q.row, `Answer is ${'ABCD'[idx]} but Option ${'ABCD'[idx]} is empty.`); continue }

    const difficulty = parseDifficulty(q.difficulty)
    if (difficulty === 'bad') { err(L.questions, q.row, `Difficulty "${clean(q.difficulty)}" must be Easy, Medium or Hard.`); continue }
    if (kind === 'practice' && !difficulty) { err(L.questions, q.row, 'Practice questions need a Difficulty (Easy, Medium or Hard).'); continue }

    const explanation = clean(q.explanation)
    if (kind === 'practice' && !explanation) { err(L.questions, q.row, 'Practice questions need an Explanation.'); continue }

    const gk = groupKey(tKey, kind)
    const dupKey = `${gk}|${text.toLowerCase()}`
    if (seenText.has(dupKey)) warn(L.questions, q.row, `This question has the same text as row ${seenText.get(dupKey)}.`)
    else seenText.set(dupKey, q.row)

    const g = groups.get(gk) ?? { label, kind, total: 0, easy: 0, medium: 0, hard: 0 }
    g.total++
    if (difficulty) g[difficulty]++
    groups.set(gk, g)
    byKind[kind]++

    payload.questions.push({
      subject: kind === 'mock_exam' ? null : subject,
      topic: kind === 'mock_exam' ? null : topic,
      kind, difficulty,
      question: text,
      options: filled,
      answer: opts[idx],
      explanation: explanation || null,
    })
  }

  // ── Size rules (whole-file replacement only) ──────────────
  let toRemove = 0
  if (ctx.mode === 'replace') {
    for (const [gk, g] of groups) {
      if (g.kind === 'practice') {
        const r = PRACTICE_RULE
        if (g.total !== r.total || g.easy !== r.easy || g.medium !== r.medium || g.hard !== r.hard) {
          err(L.questions, undefined,
            `${g.label} has ${g.total} Practice questions (${g.easy} easy, ${g.medium} medium, ${g.hard} hard). ` +
            `It needs exactly ${r.total}: ${r.easy} easy, ${r.medium} medium, ${r.hard} hard.`)
        }
      }
      if (g.kind === 'mock_exam' && g.total !== MOCK_TOTAL) {
        err(L.questions, undefined, `The Mock Exam has ${g.total} questions. It needs exactly ${MOCK_TOTAL}.`)
      }
      const existing = ctx.existingImportedCounts.get(gk) ?? 0
      if (existing > g.total) toRemove += existing - g.total
    }
  }

  // ── Completeness (informational: never blocks saving) ─────
  const missing: Partial<Record<Kind, number>> = {}
  if (raw.sheetsPresent.includes(L.questions) && fileTopics.size > 0) {
    for (const kind of KINDS.filter(k => k !== 'mock_exam')) {
      const lacking = [...fileTopics].filter(([key]) => !groups.has(groupKey(key, kind)) && !ctx.existingImportedCounts.has(groupKey(key, kind)))
      if (lacking.length) {
        missing[kind] = lacking.length
        const names = lacking.slice(0, 3).map(([, label]) => label).join('; ')
        warn(L.questions, undefined,
          `${lacking.length} of ${fileTopics.size} topics have no ${KIND_LABEL[kind]} yet (for example: ${names}${lacking.length > 3 ? '; ...' : ''}).`)
      }
    }
    if (!groups.has(groupKey(null, 'mock_exam')) && !ctx.existingImportedCounts.has(groupKey(null, 'mock_exam'))) {
      add('info', L.questions, undefined, 'There is no Mock Exam in this file yet.')
    }
  }

  const newSubjects = payload.subjects.filter(s => !ctx.existingSubjectSlugs.has(slugify(s.name))).length
  const newTopics = payload.topics.filter(t => !ctx.existingTopicKeys.has(topicKey(t.subject, t.title))).length

  const summary: ImportSummary = {
    syllabus: !!payload.syllabus,
    subjects: { total: payload.subjects.length, new: newSubjects, existing: payload.subjects.length - newSubjects },
    topics: { total: payload.topics.length, new: newTopics, existing: payload.topics.length - newTopics },
    questions: { total: payload.questions.length, byKind, toRemove },
    legacyQuestionsUntouched: ctx.legacyQuestionCount,
    missing,
  }

  return {
    issues,
    errorCount: issues.filter(i => i.level === 'error').length,
    warningCount: issues.filter(i => i.level === 'warning').length,
    payload,
    summary,
  }
}
