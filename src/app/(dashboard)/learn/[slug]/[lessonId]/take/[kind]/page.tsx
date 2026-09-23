'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { KIND_LABEL, type Kind } from '@/lib/import/types'
import { ArrowLeft, Lock, RefreshCw, Construction } from 'lucide-react'

type Question = { quiz_id: string; question: string; options: string[] }
type Phase = 'loading' | 'not_ready' | 'intro' | 'active' | 'saving' | 'result' | 'error'

export default function TakeTestPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const kind = params.kind as Kind
  const label = KIND_LABEL[kind] ?? 'Test'

  const [phase, setPhase] = useState<Phase>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [questionSetId, setQuestionSetId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [passMark, setPassMark] = useState(50)
  const [timeLimitSec, setTimeLimitSec] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [startedAt, setStartedAt] = useState<string>('')
  const [result, setResult] = useState<{ score: number; total: number; percent: number; passed: boolean; attempt_number: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  useEffect(() => { load() }, [lessonId, kind])

  async function load() {
    setPhase('loading')
    setErrorMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: set, error } = await supabase
      .from('question_sets')
      .select('id, question_count, time_limit_sec, pass_mark, is_active')
      .eq('lesson_id', lessonId).eq('type', kind)
      .maybeSingle()

    if (error || !set || !set.is_active || set.question_count === 0) {
      setPhase('not_ready')
      return
    }
    setQuestionSetId(set.id)
    setPassMark(set.pass_mark)
    setTimeLimitSec(set.time_limit_sec)
    setPhase('intro')
  }

  async function startTest() {
    if (!questionSetId) return
    setPhase('loading')
    submittedRef.current = false
    try {
      const res = await authedFetch('/api/test/start', { questionSetId })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json.error || 'Could not start this test.'); setPhase('error'); return }
      setQuestions(json.questions)
      setAnswers({})
      setCurrent(0)
      setStartedAt(new Date().toISOString())
      setPhase('active')
      if (json.time_limit_sec) {
        setTimeLeft(json.time_limit_sec)
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev === null) return null
            if (prev <= 1) { clearInterval(timerRef.current!); submitTest(); return 0 }
            return prev - 1
          })
        }, 1000)
      }
    } catch {
      setErrorMsg('Network error starting the test.')
      setPhase('error')
    }
  }

  function selectAnswer(chosen: string) {
    setAnswers(prev => ({ ...prev, [current]: chosen }))
  }

  const submitTest = useCallback(async () => {
    if (submittedRef.current || !questionSetId) return
    submittedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('saving')

    const payload = questions.map((q, i) => ({ quiz_id: q.quiz_id, chosen: answers[i] ?? null }))
    try {
      const res = await authedFetch('/api/test/submit', { questionSetId, answers: payload, startedAt })
      const json = await res.json()
      if (!res.ok) { setErrorMsg(json.error || 'Could not save your result.'); setPhase('error'); return }
      setResult(json)
      setPhase('result')
    } catch {
      setErrorMsg('Network error saving your result.')
      setPhase('error')
    }
  }, [questionSetId, questions, answers, startedAt])

  function next() {
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else submitTest()
  }
  function previous() {
    if (current > 0) setCurrent(c => c - 1)
  }
  function retry() {
    submittedRef.current = false
    setResult(null)
    load()
  }

  if (phase === 'loading') return <div className="max-w-2xl mx-auto text-center py-20 font-medium text-slate-400">Loading…</div>

  if (phase === 'not_ready') return (
    <div className="max-w-2xl mx-auto text-center py-16 bg-white border border-[#E8E0D0] rounded-2xl my-10 shadow-md px-6">
      <Construction size={40} className="text-[#C89B5A] mx-auto mb-4" />
      <h1 className="text-[#2D2416] text-xl font-black mb-2">{label} isn't ready yet</h1>
      <p className="text-sm text-[#8B7355] mb-6">Check back once questions have been added for this topic.</p>
      <Link href={`/learn/${slug}/${lessonId}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white bg-[#4F7C82] hover:bg-[#3d6068] transition-all">
        <ArrowLeft size={14} /> Back to the topic
      </Link>
    </div>
  )

  if (phase === 'error') return (
    <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white border border-red-100 rounded-2xl my-10 shadow-sm">
      <Lock size={22} className="text-red-400 mx-auto mb-4" />
      <p className="text-red-600 text-sm font-bold mb-6">{errorMsg}</p>
      <Link href={`/learn/${slug}/${lessonId}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white bg-[#4F7C82] hover:bg-[#3d6068] transition-all">
        <ArrowLeft size={14} /> Back to the topic
      </Link>
    </div>
  )

  if (phase === 'intro') return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="text-center mb-8">
        <h1 className="text-slate-900 text-2xl font-black tracking-tight mb-1">{label}</h1>
      </div>
      <div className="bg-[#FAF7F2] border border-slate-200/60 rounded-2xl p-6 mb-8">
        {[
          ['Time limit', timeLimitSec ? `${Math.round(timeLimitSec / 60)} minutes` : 'Untimed'],
          ['Pass mark', `${passMark}%`],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between py-3 border-b border-slate-200/40 last:border-0 font-medium">
            <span className="text-slate-500 text-sm">{l}</span>
            <span className="text-slate-900 font-bold text-sm">{v}</span>
          </div>
        ))}
      </div>
      <button onClick={startTest} className="w-full py-4 rounded-full font-black text-sm uppercase tracking-wider text-white bg-[#C89B5A] hover:bg-[#b8893a] shadow-md transition-all">
        Start {label}
      </button>
    </div>
  )

  if (phase === 'saving') return (
    <div className="max-w-xl mx-auto text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm my-10">
      <div className="inline-block w-8 h-8 border-4 border-[#C89B5A] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 text-xs font-black uppercase tracking-wider">Saving your result…</p>
    </div>
  )

  if (phase === 'active') {
    const q = questions[current]
    const selected = answers[current]
    const mins = timeLeft !== null ? String(Math.floor(timeLeft / 60)).padStart(2, '0') : null
    const secs = timeLeft !== null ? String(timeLeft % 60).padStart(2, '0') : null
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <p className="text-slate-400 font-medium text-xs">Question {current + 1} of {questions.length}</p>
          {timeLeft !== null && (
            <span className="font-black text-sm px-4 py-1.5 rounded-full text-white shadow-sm" style={{ backgroundColor: timeLeft < 60 ? '#EF4444' : '#C89B5A' }}>
              ⏱ {mins}:{secs}
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%`, background: '#4F7C82' }} />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-8 mb-5 shadow-md">
          <p className="text-slate-900 text-lg font-extrabold leading-relaxed">{q.question}</p>
        </div>
        <div className="flex flex-col gap-3 mb-8">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => selectAnswer(opt)}
              className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all border-2 ${
                selected === opt ? 'bg-[#4F7C82] border-[#4F7C82] text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-[#4F7C82]'
              }`}>
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
        </div>
        <div className="flex justify-between gap-4">
          <button onClick={previous} disabled={current === 0}
            className="px-6 py-3.5 rounded-full font-bold text-xs uppercase text-[#4F7C82] border-2 border-[#4F7C82] disabled:opacity-30">← Previous</button>
          <button onClick={next} disabled={!selected}
            className="px-8 py-3.5 rounded-full font-black text-xs uppercase text-white bg-[#C89B5A] disabled:opacity-40 shadow-md">
            {current === questions.length - 1 ? 'Submit' : 'Next →'}
          </button>
        </div>
      </div>
    )
  }

  // result
  if (!result) return null
  return (
    <div className="max-w-xl mx-auto px-6 py-10 text-center">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">{label} Result</p>
      <div className="text-4xl font-black mb-2" style={{ color: result.passed ? '#10B981' : '#EF4444' }}>{result.percent}%</div>
      <p className="text-slate-500 text-sm font-medium mb-6">{result.score} / {result.total} correct — attempt #{result.attempt_number}</p>
      <div className="flex gap-3 justify-center flex-wrap">
        {!result.passed && (
          <button onClick={retry} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase text-[#4F7C82] border-2 border-[#4F7C82]">
            <RefreshCw size={13} /> Retake
          </button>
        )}
        <Link href={`/learn/${slug}/${lessonId}`} className="px-6 py-3 rounded-full font-black text-xs uppercase text-white bg-[#C89B5A] shadow-md">
          Back to Topic
        </Link>
      </div>
    </div>
  )
}

async function authedFetch(url: string, body: unknown) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(body),
  })
}
