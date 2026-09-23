import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildWorkbook, type CurrentData } from '@/lib/import/xlsx'

export const runtime = 'nodejs'

// Downloads the TRACK'S EXISTING content as the same 4-sheet file, so an admin
// can edit what's already there instead of starting from a blank template.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const schoolId = req.nextUrl.searchParams.get('schoolId')
  if (!schoolId) return NextResponse.json({ error: 'Missing schoolId.' }, { status: 400 })

  const [{ data: school }, { data: subjects }, { data: lessons }, { data: content }, { data: quizzes }] = await Promise.all([
    supabase.from('schools').select('syllabus, objectives').eq('id', schoolId).single(),
    supabase.from('subjects').select('id, name, description, order_index').eq('school_id', schoolId).order('order_index'),
    supabase.from('lessons').select('id, subject_id, category, title, description, content, example, order_index').eq('school_id', schoolId).order('order_index'),
    supabase.from('topic_content').select('lesson_id, type, body'),
    supabase.from('quizzes').select('lesson_id, kind, difficulty, question, options, answer, explanation').eq('school_id', schoolId).not('kind', 'is', null),
  ])

  const subjectById = new Map((subjects ?? []).map(s => [s.id as string, s]))
  const lessonById = new Map((lessons ?? []).map(l => [l.id as string, l]))
  const contentByLesson = new Map<string, Record<string, string>>()
  for (const c of content ?? []) {
    if (!lessonById.has(c.lesson_id as string)) continue
    const bucket = contentByLesson.get(c.lesson_id as string) ?? {}
    bucket[c.type as string] = c.body as string
    contentByLesson.set(c.lesson_id as string, bucket)
  }

  const KIND_LABEL: Record<string, string> = {
    practice: 'Practice', knowledge_check: 'Knowledge Check',
    application_test: 'Application Test', mastery_test: 'Mastery Test', mock_exam: 'Mock Exam',
  }
  const DIFF_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

  const current: CurrentData = {
    syllabus: school?.syllabus || (school?.objectives?.length ?? 0) > 0
      ? { overview: school?.syllabus ?? '', objectives: (school?.objectives ?? []) as string[] }
      : null,
    subjects: (subjects ?? []).map(s => ({ name: s.name, description: s.description ?? '', order: s.order_index })),
    topics: (lessons ?? []).map(l => {
      const c = contentByLesson.get(l.id as string) ?? {}
      return {
        subject: subjectById.get(l.subject_id as string)?.name ?? l.category,
        title: l.title, order: l.order_index, lesson: l.content ?? '',
        keyPoints: c.titbits ?? '', resources: c.resources ?? '', summary: c.summary ?? '', revision: c.revision ?? '',
      }
    }),
    questions: (quizzes ?? []).map(q => {
      const lesson = q.lesson_id ? lessonById.get(q.lesson_id as string) : null
      const subject = lesson ? subjectById.get(lesson.subject_id as string) : null
      const opts = (q.options ?? []) as string[]
      const idx = opts.findIndex(o => o === q.answer)
      return {
        subject: subject?.name ?? '', topic: lesson?.title ?? '',
        set: KIND_LABEL[q.kind as string] ?? q.kind as string,
        difficulty: DIFF_LABEL[q.difficulty as string] ?? '',
        question: q.question, options: opts,
        answer: idx >= 0 ? 'ABCD'[idx] : '',
        explanation: q.explanation ?? '',
      }
    }),
  }

  const buf = await buildWorkbook(current)
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="bearilly-current-content.xlsx"`,
    },
  })
}
