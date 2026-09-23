// Shared shapes for the content importer (Excel upload + paste from AI).

export const KINDS = ['practice', 'knowledge_check', 'application_test', 'mastery_test', 'mock_exam'] as const
export type Kind = (typeof KINDS)[number]

export const KIND_LABEL: Record<Kind, string> = {
  practice: 'Practice',
  knowledge_check: 'Knowledge Check',
  application_test: 'Application Test',
  mastery_test: 'Mastery Test',
  mock_exam: 'Mock Exam',
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Issue = {
  level: 'error' | 'warning' | 'info'
  sheet: string
  row?: number
  message: string
}

// ── Raw rows: exactly what was typed, before any checking ────────────
export type RawSubject = { row: number; name: string; description: string; order: string }

export type RawTopic = {
  row: number
  subject: string
  title: string
  order: string
  lesson: string
  keyPoints: string
  resources: string
  summary: string
  revision: string
  /** true when pasting ONE field into an existing topic (lesson text not required). */
  patch?: boolean
}

export type RawQuestion = {
  row: number
  subject: string
  topic: string
  set: string
  difficulty: string
  question: string
  options: [string, string, string, string]
  answer: string
  explanation: string
}

export type RawImport = {
  syllabus?: { row: number; overview: string; objectives: string; audience: string }
  subjects: RawSubject[]
  topics: RawTopic[]
  questions: RawQuestion[]
  /** Which sheets existed in the file (used to decide which completeness checks make sense). */
  sheetsPresent: string[]
  labels: { subjects: string; topics: string; questions: string; syllabus: string }
}

// ── Clean payload sent to the database function ─────────────────────
export type ImportPayload = {
  syllabus?: { overview: string | null; objectives: string[] }
  subjects: { name: string; description: string | null; order: number | null }[]
  topics: {
    subject: string
    title: string
    order: number | null
    lesson: string | null
    key_points: string | null
    resources: string | null
    summary: string | null
    revision: string | null
  }[]
  questions: {
    subject: string | null
    topic: string | null
    kind: Kind
    difficulty: Difficulty | null
    question: string
    options: string[]
    answer: string
    explanation: string | null
  }[]
}

export type ImportMode = 'replace' | 'append'

/** What already exists in the track, so the check can say "new" vs "update" and count removals. */
export type ImportContext = {
  mode: ImportMode
  existingSubjectSlugs: Set<string>
  /** "subject-slug/topic-slug" */
  existingTopicKeys: Set<string>
  /** "topicKey#kind" or "mock#mock_exam" -> number of imported questions already saved */
  existingImportedCounts: Map<string, number>
  /** Older questions that are not part of any import (they are never touched). */
  legacyQuestionCount: number
}

export type ImportSummary = {
  syllabus: boolean
  subjects: { total: number; new: number; existing: number }
  topics: { total: number; new: number; existing: number }
  questions: { total: number; byKind: Record<Kind, number>; toRemove: number }
  legacyQuestionsUntouched: number
  /** Topics in this file that have no questions of a given kind yet (only when a Questions sheet is present). */
  missing: Partial<Record<Kind, number>>
}

export type ValidationResult = {
  issues: Issue[]
  errorCount: number
  warningCount: number
  payload: ImportPayload
  summary: ImportSummary
}
