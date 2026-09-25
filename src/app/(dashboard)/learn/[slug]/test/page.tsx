'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSubject } from '@/lib/subjects'
import { ArrowLeft, Lock } from 'lucide-react'

/**
 * The "finish all lessons in this subject, then take a quiz" entry point.
 * This used to BE the quiz itself (client-graded, the score-tampering hole).
 * It now only finds the right question_sets row (subject-scoped: subject_id
 * set, lesson_id null) and hands off to the same secure test-taking page
 * every topic test already uses — no separate quiz UI to maintain, and no
 * separate security fix needed for this one.
 */
export default function SubjectTestRedirect() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { subject, loading: subjectLoading, notFound } = useSubject(slug)
  const [phase, setPhase] = useState<'loading' | 'not_ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (subjectLoading) return
    if (notFound || !subject) { router.push('/learn'); return }
    go()
  }, [subject, subjectLoading, notFound])

  async function go() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // All topics in the subject must be complete first (same rule as before).
    const { data: topics } = await supabase.from('lessons').select('id').eq('subject_id', subject!.id)
    const { data: completed } = await supabase.from('progress').select('lesson_id')
      .eq('user_id', user.id).eq('status', 'completed')
    const done = new Set((completed ?? []).map(p => p.lesson_id))
    const allDone = (topics ?? []).length > 0 && (topics ?? []).every(t => done.has(t.id))
    if (!allDone) { setPhase('not_ready'); return }

    const { data: set, error } = await supabase
      .from('question_sets')
      .select('id, lesson_id, question_count, is_active')
      .eq('subject_id', subject!.id).is('lesson_id', null)
      .maybeSingle()

    if (error) { setErrorMsg('Could not load this quiz.'); setPhase('error'); return }
    if (!set || !set.is_active || set.question_count === 0) { setPhase('not_ready'); return }

    // Reuse the same secure test-taking page as topic tests. It reads the
    // question_sets id directly, so any valid id works regardless of scope.
    router.replace(`/learn/${slug}/subject-quiz/${set.id}`)
  }

  if (phase === 'not_ready') return (
    <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white border border-slate-100 rounded-2xl my-10 shadow-sm">
      <div className="w-14 h-14 bg-[#FAF7F2] border border-slate-200/60 rounded-full flex items-center justify-center mx-auto mb-5">
        <Lock size={22} className="text-slate-400" />
      </div>
      <h2 className="text-slate-900 text-xl font-black tracking-tight mb-2">Not quite ready</h2>
      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
        Finish every topic in <strong className="text-slate-800 font-bold">{subject?.name}</strong> first, or check back —
        this subject's quiz may not be set up yet.
      </p>
      <Link href={`/learn/${slug}`} className="inline-flex items-center gap-2 justify-center px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#4F7C82]/90 shadow-md transition-all">
        <ArrowLeft size={14} /> Back to {subject?.name ?? 'lessons'}
      </Link>
    </div>
  )

  if (phase === 'error') return (
    <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white border border-red-100 rounded-2xl my-10 shadow-sm">
      <p className="text-red-600 text-sm font-bold mb-6">{errorMsg}</p>
      <Link href={`/learn/${slug}`} className="inline-flex items-center gap-2 justify-center px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#4F7C82]/90 shadow-md transition-all">
        <ArrowLeft size={14} /> Back
      </Link>
    </div>
  )

  return <div className="max-w-2xl mx-auto text-center py-20 font-medium text-slate-400">Loading…</div>
}
