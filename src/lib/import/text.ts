/** Same rule as the database's import_slug(): "Time & Money!" -> "time-money". */
export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function clean(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim() : ''
}

/** Split a multi-line cell into lines, dropping blanks and leading bullets ("- ", "• ", "1. "). */
export function toLines(v: string): string[] {
  return clean(v)
    .split('\n')
    .map(l => l.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
}

/** "" -> null. Whole numbers only. NaN is reported by the caller, not swallowed here. */
export function parseOrder(v: string): number | null | 'bad' {
  const t = clean(v)
  if (t === '') return null
  if (!/^\d+$/.test(t)) return 'bad'
  const n = Number(t)
  return Number.isSafeInteger(n) ? n : 'bad'
}

export function topicKey(subject: string, title: string): string {
  return `${slugify(subject)}/${slugify(title)}`
}
