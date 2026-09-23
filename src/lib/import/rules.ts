// Shared rule reused by both the Excel importer (validate.ts) and the manual
// Questions tab, so "20 questions, 5/10/5" is defined in exactly one place.
import { PRACTICE_RULE, MOCK_TOTAL } from './validate'
export { PRACTICE_RULE, MOCK_TOTAL }

export type SizeCheck = {
  ok: boolean
  message: string | null
}

export function checkPracticeSize(easy: number, medium: number, hard: number): SizeCheck {
  const total = easy + medium + hard
  const r = PRACTICE_RULE
  if (total === r.total && easy === r.easy && medium === r.medium && hard === r.hard) {
    return { ok: true, message: null }
  }
  return {
    ok: false,
    message: `${total} of ${r.total} questions (${easy} easy, ${medium} medium, ${hard} hard). Needs exactly ${r.easy} easy, ${r.medium} medium, ${r.hard} hard.`,
  }
}

export function checkMockSize(total: number): SizeCheck {
  if (total === MOCK_TOTAL) return { ok: true, message: null }
  return { ok: false, message: `${total} of ${MOCK_TOTAL} questions.` }
}
