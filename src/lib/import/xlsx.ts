// Excel file <-> importer rows. Server-side only (uses exceljs).
import ExcelJS from 'exceljs'
import type { Issue, RawImport, RawQuestion } from './types'

export const SHEET = { syllabus: 'Syllabus', subjects: 'Subjects', topics: 'Topics', questions: 'Questions' } as const

export const HEADERS = {
  Syllabus: ['Overview', 'Objectives', "Who It's For"],
  Subjects: ['Subject', 'Description', 'Order'],
  Topics: ['Subject', 'Topic', 'Order', 'Lesson', 'Key Points', 'Resources', 'Summary', 'Revision'],
  Questions: ['Subject', 'Topic', 'Set', 'Difficulty', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer', 'Explanation'],
} as const

// Columns that must exist for a sheet to be readable. Others are optional.
const REQUIRED: Record<string, string[]> = {
  Syllabus: [],
  Subjects: ['Subject'],
  Topics: ['Subject', 'Topic', 'Lesson'],
  Questions: ['Set', 'Question', 'Option A', 'Option B', 'Answer'],
}

const WIDTHS: Record<string, number> = {
  Overview: 60, Objectives: 50, "Who It's For": 30,
  Subject: 24, Description: 40, Order: 8, Topic: 30, Lesson: 70, 'Key Points': 45, Resources: 50, Summary: 45, Revision: 45,
  Set: 18, Difficulty: 12, Question: 60, 'Option A': 28, 'Option B': 28, 'Option C': 28, 'Option D': 28, Answer: 9, Explanation: 50,
}

const MAX_ROWS = 6000
export const MAX_FILE_BYTES = 5 * 1024 * 1024

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const isExample = (first: string) => /^example\s*:/i.test(first.trim())

// ── Reading ─────────────────────────────────────────────────────────
type SheetRows = { rowNumber: number; get: (header: string) => string }[]

function readSheet(ws: ExcelJS.Worksheet, sheetName: keyof typeof HEADERS, issues: Issue[]): SheetRows | null {
  const headerRow = ws.getRow(1)
  const colOf = new Map<string, number>()
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    const key = norm(cell.text ?? '')
    if (key && !colOf.has(key)) colOf.set(key, col)
  })

  const missing = REQUIRED[sheetName].filter(h => !colOf.has(norm(h)))
  if (missing.length) {
    issues.push({
      level: 'error', sheet: sheetName, row: 1,
      message: `The "${sheetName}" sheet is missing the column${missing.length > 1 ? 's' : ''} ${missing.map(m => `"${m}"`).join(', ')}. Use the template's headings exactly.`,
    })
    return null
  }

  const firstCol = colOf.get(norm(HEADERS[sheetName][0]))
  const out: SheetRows = []
  let processed = 0
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const get = (header: string) => {
      const col = colOf.get(norm(header))
      return col ? (row.getCell(col).text ?? '') : ''
    }
    const anyText = HEADERS[sheetName].some(h => get(h).trim() !== '')
    if (!anyText) continue
    if (firstCol && isExample(row.getCell(firstCol).text ?? '')) continue
    if (++processed > MAX_ROWS) {
      issues.push({ level: 'error', sheet: sheetName, message: `The "${sheetName}" sheet has more than ${MAX_ROWS} rows. Split it into two files.` })
      break
    }
    out.push({ rowNumber: r, get })
  }
  return out
}

export async function readWorkbook(buffer: Buffer): Promise<{ raw: RawImport | null; issues: Issue[] }> {
  const issues: Issue[] = []
  const wb = new ExcelJS.Workbook()
  try {
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  } catch {
    return { raw: null, issues: [{ level: 'error', sheet: 'File', message: 'That file could not be read. Please upload an Excel (.xlsx) file made from the template.' }] }
  }

  const find = (name: string) => wb.worksheets.find(ws => norm(ws.name) === norm(name))
  const raw: RawImport = {
    subjects: [], topics: [], questions: [], sheetsPresent: [],
    labels: { syllabus: SHEET.syllabus, subjects: SHEET.subjects, topics: SHEET.topics, questions: SHEET.questions },
  }

  const syl = find(SHEET.syllabus)
  if (syl) {
    raw.sheetsPresent.push(SHEET.syllabus)
    const rows = readSheet(syl, 'Syllabus', issues)
    if (rows && rows[0]) {
      const r = rows[0]
      raw.syllabus = { row: r.rowNumber, overview: r.get('Overview'), objectives: r.get('Objectives'), audience: r.get("Who It's For") }
      if (rows.length > 1) issues.push({ level: 'warning', sheet: SHEET.syllabus, row: rows[1].rowNumber, message: 'Only the first row of the Syllabus sheet is used.' })
    }
  }

  const sub = find(SHEET.subjects)
  if (sub) {
    raw.sheetsPresent.push(SHEET.subjects)
    for (const r of readSheet(sub, 'Subjects', issues) ?? [])
      raw.subjects.push({ row: r.rowNumber, name: r.get('Subject'), description: r.get('Description'), order: r.get('Order') })
  }

  const top = find(SHEET.topics)
  if (top) {
    raw.sheetsPresent.push(SHEET.topics)
    for (const r of readSheet(top, 'Topics', issues) ?? [])
      raw.topics.push({
        row: r.rowNumber, subject: r.get('Subject'), title: r.get('Topic'), order: r.get('Order'), lesson: r.get('Lesson'),
        keyPoints: r.get('Key Points'), resources: r.get('Resources'), summary: r.get('Summary'), revision: r.get('Revision'),
      })
  }

  const qs = find(SHEET.questions)
  if (qs) {
    raw.sheetsPresent.push(SHEET.questions)
    for (const r of readSheet(qs, 'Questions', issues) ?? [])
      raw.questions.push({
        row: r.rowNumber, subject: r.get('Subject'), topic: r.get('Topic'), set: r.get('Set'), difficulty: r.get('Difficulty'),
        question: r.get('Question'), options: [r.get('Option A'), r.get('Option B'), r.get('Option C'), r.get('Option D')],
        answer: r.get('Answer'), explanation: r.get('Explanation'),
      })
  }

  if (raw.sheetsPresent.length === 0) {
    issues.push({
      level: 'error', sheet: 'File',
      message: 'None of the expected sheets were found. The file needs sheets named Syllabus, Subjects, Topics and Questions (use the template).',
    })
    return { raw: null, issues }
  }
  return { raw, issues }
}

// ── Writing (template, or the track's current content) ──────────────
export type CurrentData = {
  syllabus: { overview: string; objectives: string[] } | null
  subjects: { name: string; description: string; order: number }[]
  topics: { subject: string; title: string; order: number; lesson: string; keyPoints: string; resources: string; summary: string; revision: string }[]
  questions: { subject: string; topic: string; set: string; difficulty: string; question: string; options: string[]; answer: string; explanation: string }[]
}

const EXAMPLES: Record<string, (string | number)[]> = {
  Syllabus: ['EXAMPLE: What this track covers, who it is for and how it is structured. (Delete this row or write over it.)', 'Explain the core ideas of each subject\nApply them to real situations', 'Beginners with no experience'],
  Subjects: ['EXAMPLE: Financial Literacy', 'Managing money, saving and investing', 1],
  Topics: [
    'EXAMPLE: Financial Literacy', 'Understanding Net Worth', 1,
    'Net worth is what you own minus what you owe. In this lesson you learn how to calculate it...',
    'Net worth = assets minus liabilities\nTrack it every month',
    'Net worth explained | https://example.com/net-worth',
    'Net worth shows your real financial position.',
    'Net worth - assets minus liabilities',
  ],
  Questions: [
    'EXAMPLE: Financial Literacy', 'Understanding Net Worth', 'Practice', 'Easy', 'What is net worth?',
    'Total income', 'Assets minus liabilities', 'Total savings', 'Monthly salary', 'B',
    'Net worth measures what you own minus what you owe.',
  ],
}

function styleSheet(ws: ExcelJS.Worksheet, headers: readonly string[]) {
  ws.columns = headers.map(h => ({ header: h, key: h, width: WIDTHS[h] ?? 20 }))
  const head = ws.getRow(1)
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }
  head.alignment = { vertical: 'middle' }
  head.height = 22
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export async function buildWorkbook(current?: CurrentData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Bearilly'

  const sheets: { name: keyof typeof HEADERS; rows: (string | number)[][] }[] = [
    { name: 'Syllabus', rows: current ? (current.syllabus ? [[current.syllabus.overview, current.syllabus.objectives.join('\n'), '']] : []) : [EXAMPLES.Syllabus] },
    { name: 'Subjects', rows: current ? current.subjects.map(s => [s.name, s.description, s.order]) : [EXAMPLES.Subjects] },
    { name: 'Topics', rows: current ? current.topics.map(t => [t.subject, t.title, t.order, t.lesson, t.keyPoints, t.resources, t.summary, t.revision]) : [EXAMPLES.Topics] },
    {
      name: 'Questions',
      rows: current
        ? current.questions.map(q => [q.subject, q.topic, q.set, q.difficulty, q.question, q.options[0] ?? '', q.options[1] ?? '', q.options[2] ?? '', q.options[3] ?? '', q.answer, q.explanation])
        : [EXAMPLES.Questions],
    },
  ]

  for (const { name, rows } of sheets) {
    const ws = wb.addWorksheet(name)
    styleSheet(ws, HEADERS[name])
    rows.forEach((values, i) => {
      const row = ws.addRow(values)
      row.alignment = { vertical: 'top', wrapText: true }
      if (!current && i === 0) row.font = { italic: true, color: { argb: 'FF94A3B8' } }
    })

    if (name === 'Questions') {
      const last = Math.max(3000, rows.length + 500)
      const col = (h: string) => HEADERS.Questions.indexOf(h as never) + 1
      const lists: [string, string][] = [
        ['Set', '"Practice,Knowledge Check,Application Test,Mastery Test,Mock Exam"'],
        ['Difficulty', '"Easy,Medium,Hard"'],
        ['Answer', '"A,B,C,D"'],
      ]
      for (const [h, formula] of lists)
        for (let r = 2; r <= last; r++)
          ws.getCell(r, col(h)).dataValidation = { type: 'list', allowBlank: true, formulae: [formula], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Please choose one of the values in the drop-down.' }
    }
  }
  return Buffer.from(await wb.xlsx.writeBuffer())
}

export type { RawQuestion }
