// Loads "what already exists in this track" so the checker can tell new from existing,
// and count how many saved questions a replace would remove.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImportContext, ImportMode } from './types'
import { groupKey } from './validate'
import { slugify } from './text'

type LessonRow = { id: string; title: string; subjects: { slug: string } | { slug: string }[] | null }

function subjectSlugOf(row: LessonRow): string | null {
  const s = row.subjects
  if (!s) return null
  return Array.isArray(s) ? (s[0]?.slug ?? null) : s.slug
}

export async function loadImportContext(
  supabase: SupabaseClient, schoolId: string, mode: ImportMode
): Promise<ImportContext> {
  const [{ data: subjects }, { data: lessons }, { data: quizzes }] = await Promise.all([
    supabase.from('subjects').select('slug').eq('school_id', schoolId),
    supabase.from('lessons').select('id, title, subjects(slug)').eq('school_id', schoolId).returns<LessonRow[]>(),
    supabase.from('quizzes').select('lesson_id, kind').eq('school_id', schoolId),
  ])

  const existingSubjectSlugs = new Set((subjects ?? []).map(s => s.slug as string))

  const existingTopicKeys = new Set<string>()
  const idToKey = new Map<string, string>()
  for (const l of lessons ?? []) {
    const subjSlug = subjectSlugOf(l)
    if (!subjSlug) continue
    const key = `${subjSlug}/${slugify(l.title)}`
    existingTopicKeys.add(key)
    idToKey.set(l.id, key)
  }

  const existingImportedCounts = new Map<string, number>()
  let legacyQuestionCount = 0
  for (const q of quizzes ?? []) {
    const kind = q.kind as string | null
    if (!kind) { legacyQuestionCount++; continue }
    const lessonId = q.lesson_id as string | null
    const tKey = lessonId ? (idToKey.get(lessonId) ?? null) : null
    const gk = groupKey(tKey, kind as never)
    existingImportedCounts.set(gk, (existingImportedCounts.get(gk) ?? 0) + 1)
  }

  return { mode, existingSubjectSlugs, existingTopicKeys, existingImportedCounts, legacyQuestionCount }
}
