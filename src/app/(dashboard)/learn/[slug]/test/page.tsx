'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Trophy, RefreshCw, CheckCircle2, XCircle, ChevronRight, HelpCircle } from 'lucide-react'
import { Camera, Megaphone, Lightbulb, Rocket, Briefcase, Zap, Monitor, DollarSign } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const categoryMap: Record<string, { name: string; Icon: LucideIcon; accent: string }> = {
  'content-creation':   { name: 'Content Creation',   Icon: Camera,     accent: '#C89B5A' },
  'digital-marketing':  { name: 'Digital Marketing',   Icon: Megaphone,  accent: '#4F7C82' },
  'entrepreneurship':   { name: 'Entrepreneurship',    Icon: Lightbulb,  accent: '#C89B5A' },
  'career-development': { name: 'Career Development',  Icon: Rocket,     accent: '#4F7C82' },
  'business-skills':    { name: 'Business Skills',     Icon: Briefcase,  accent: '#C89B5A' },
  'productivity':       { name: 'Productivity',        Icon: Zap,        accent: '#4F7C82' },
  'technology':         { name: 'Technology',          Icon: Monitor,    accent: '#4F7C82' },
  'financial-literacy': { name: 'Financial Literacy',  Icon: DollarSign, accent: '#C89B5A' },
}

type Question = { id: string; question: string; options: string[]; answer: string }
type Phase = 'loading' | 'not_ready' | 'intro' | 'active' | 'result' | 'saving'

const TOTAL_MARKS = 100
const MARKS_PER_Q = 5
const TIME_SECONDS = 300

export default function CategoryTestPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const cat = categoryMap[slug]

  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(TIME_SECONDS)
  const [score, setScore] = useState(0)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [saveError, setSaveError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!cat) { router.push('/learn'); return }
    checkReadiness()
  }, [slug])

  async function checkReadiness() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: lessons } = await supabase.from('lessons').select('id').eq('category', cat.name)
    const { data: progress } = await supabase.from('progress').select('lesson_id')
      .eq('user_id', user.id).eq('status', 'completed')

    const completedIds = new Set((progress || []).map(p => p.lesson_id))
    const allDone = (lessons || []).every(l => completedIds.has(l.id)) && (lessons?.length ?? 0) > 0

    if (!allDone) { setPhase('not_ready'); return }

    const lessonIds = (lessons || []).map(l => l.id)
    const { data: quizData } = await supabase
      .from('quizzes').select('id, question, options, answer').in('lesson_id', lessonIds)

    const shuffled = (quizData || []).sort(() => Math.random() - 0.5).slice(0, 20)
    setQuestions(shuffled.map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
    })))
    setPhase('intro')
  }

  function startTest() {
    submittedRef.current = false
    setPhase('active')
    setTimeLeft(TIME_SECONDS)
    sessionStorage.setItem('bearilly_test_active', 'true')
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); submitTest(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function selectAnswer(answer: string) {
    setAnswers(prev => ({ ...prev, [current]: answer }))
  }

  const submitTest = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true

    if (timerRef.current) clearInterval(timerRef.current)
    sessionStorage.removeItem('bearilly_test_active')

    let correct = 0
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++ })
    const finalScore = correct * MARKS_PER_Q
    setScore(finalScore)
    setPhase('saving')
    setSaveError('')

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat.name,
          score: finalScore,
          total: TOTAL_MARKS,
          passed: finalScore >= 50,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        console.error('Quiz save failed:', json.error)
        setSaveError('Your score was calculated but could not be saved. Please contact support.')
      } else {
        setAttemptNumber(json.result?.attempt_number ?? 1)
      }
    } catch (err) {
      console.error('Quiz submit network error:', err)
      setSaveError('Network error saving your result. Please check your connection.')
    }

    setPhase('result')
  }, [questions, answers, cat])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && phase === 'active') submitTest()
    }
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (phase === 'active') {
        e.preventDefault()
        submitTest()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [phase, submitTest])

  useEffect(() => {
    const handlePopState = () => { if (phase === 'active') submitTest() }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [phase, submitTest])

  function next() {
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else submitTest()
  }

  function previous() {
    if (current > 0) setCurrent(c => c - 1)
  }

  function retryTest() {
    submittedRef.current = false
    setAnswers({})
    setCurrent(0)
    setPhase('loading')
    checkReadiness()
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const timerUrgent = timeLeft < 60

  if (!cat) return null
  const { Icon, accent } = cat

  if (phase === 'loading') return (
    <div className="max-w-2xl mx-auto text-center py-20 font-medium text-slate-400">Compiling performance vectors…</div>
  )

  if (phase === 'not_ready') return (
    <div className="max-w-xl mx-auto text-center py-16 px-6 bg-white border border-slate-100 rounded-2xl my-10 shadow-sm">
      <div className="w-14 h-14 bg-[#FAF7F2] border border-slate-200/60 rounded-full flex items-center justify-center mx-auto mb-5">
        <Lock size={22} className="text-slate-400" />
      </div>
      <h2 className="text-slate-900 text-xl font-black tracking-tight mb-2">Prerequisite Framework Missing</h2>
      <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
        You are required to complete every structural curriculum module inside <strong className="text-slate-800 font-bold">{cat.name}</strong> prior to running this performance evaluation matrix.
      </p>
      <Link
        href={`/learn/${slug}`}
        className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#4F7C82]/90 shadow-md transition-all duration-200 ease-in-out"
      >
        Return to Lessons
      </Link>
    </div>
  )

  if (phase === 'intro') return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FAF7F2] border border-[#E7C997]/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Icon size={28} style={{ color: accent }} />
        </div>
        <h1 className="text-slate-900 text-2xl font-black tracking-tight mb-1">{cat.name} Performance Audit</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Initialization strictly marks runtime timer constraints.</p>
      </div>

      <div className="bg-[#FAF7F2] border border-slate-200/60 rounded-2xl p-6 mb-8 shadow-xs">
        {[
          ['Total Questions', `${questions.length} Objective Fields`],
          ['Runtime Allocation', '5 Minutes (300s)'],
          ['Weight metrics', `${MARKS_PER_Q} Points per correct node`],
          ['Maximum Ceiling', `${TOTAL_MARKS} Total Points`],
          ['Threshold Pass', '50 Points (50%)'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between py-3 border-b border-slate-200/40 last:border-0 font-medium">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className="text-slate-900 font-bold text-sm">{val}</span>
          </div>
        ))}
      </div>

      <button
        onClick={startTest}
        className="w-full py-4 rounded-full font-black text-sm uppercase tracking-wider text-white transition-all duration-200 ease-in-out bg-[#C89B5A] hover:bg-[#C89B5A]/90 shadow-md hover:shadow-lg text-center"
      >
        Start Quiz
      </button>
    </div>
  )

  if (phase === 'saving') return (
    <div className="max-w-xl mx-auto text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm my-10">
      <div className="inline-block w-8 h-8 border-4 border-[#C89B5A] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 text-xs font-black uppercase tracking-wider">Transmitting scores to database registry…</p>
    </div>
  )

  if (phase === 'active') {
    const q = questions[current]
    const selected = answers[current]
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div>
            <p className="text-[#4F7C82] font-bold uppercase tracking-wider text-[11px] mb-0.5">{cat.name}</p>
            <p className="text-slate-400 font-medium text-xs">Question {current + 1} of {questions.length}</p>
          </div>
          <span
            className="font-black text-sm px-4 py-1.5 rounded-full tracking-widest transition-colors shadow-sm flex-shrink-0"
            style={{
              color: '#FFFFFF',
              backgroundColor: timerUrgent ? '#EF4444' : '#C89B5A',
            }}
          >
            ⏱ {mins}:{secs}
          </span>
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%`, background: '#4F7C82' }}
          />
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 mb-5 shadow-md">
          <p className="text-[#4F7C82] font-black text-sm mb-3">Question {current + 1}</p>
          <p className="text-slate-900 text-lg md:text-xl font-extrabold leading-relaxed">{q.question}</p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {q.options.map((opt, i) => {
            const isSelected = selected === opt
            return (
              <button
                key={i}
                onClick={() => selectAnswer(opt)}
                className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-200 ease-in-out border-2 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#4F7C82] border-[#4F7C82] text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#4F7C82] hover:bg-[#FAF7F2]'
                }`}
              >
                <span className="pr-4">{String.fromCharCode(65 + i)}. {opt}</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-white bg-white' : 'border-slate-300 bg-transparent'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 bg-[#4F7C82] rounded-full" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-between gap-4 items-center">
          <button
            onClick={previous}
            disabled={current === 0}
            className="px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider text-[#4F7C82] bg-transparent border-2 border-[#4F7C82] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#4F7C82] hover:text-white transition-all duration-200 ease-in-out"
          >
            ← Previous
          </button>
          {current === questions.length - 1 ? (
            <button
              onClick={next}
              disabled={!selected}
              className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed text-white bg-[#C89B5A] hover:bg-[#C89B5A]/90 shadow-md"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!selected}
              className="px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed text-white bg-[#4F7C82] hover:bg-[#4F7C82]/90 shadow-md"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    )
  }

  // Final Result Dashboard Layout Render
  const passed = score >= 50
  const percentage = Math.round((score / TOTAL_MARKS) * 100)
  const correctCount = Math.round(score / MARKS_PER_Q)

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">{cat.name} Quiz Results</p>

        <div className="relative w-40 h-40 mx-auto mb-5">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={passed ? '#4F7C82' : '#EF4444'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{percentage}%</span>
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: passed ? '#10B981' : '#EF4444' }}>
              {passed ? 'Passed ✓' : 'Failed ✗'}
            </span>
          </div>
        </div>

        <h1 className="text-slate-900 text-2xl font-black tracking-tight mb-1">
          {passed ? 'Quiz Complete!' : 'Further Preparation Required'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {score} / {TOTAL_MARKS} points — {correctCount} of {questions.length} correct
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-md">
        {[
          ['Score', `${percentage}%`],
          ['Result', passed ? 'Passed ✓' : 'Failed ✗'],
          ['Attempt', `#${attemptNumber}`],
          ['Date', new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 font-medium text-sm">
            <span className="text-slate-500">{label}</span>
            <span
              className="font-black tracking-wide"
              style={{ color: label === 'Result' ? (passed ? '#10B981' : '#EF4444') : '#1E293B' }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {saveError && (
        <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{saveError}</p>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        {!passed && (
          <button
            onClick={retryTest}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider text-[#4F7C82] bg-transparent border-2 border-[#4F7C82] hover:bg-[#4F7C82] hover:text-white transition-all duration-200 ease-in-out"
          >
            <RefreshCw size={13} /> Retake
          </button>
        )}
        <Link href={`/learn/${slug}`} className="px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider text-white bg-[#C89B5A] hover:bg-[#C89B5A]/90 transition-all duration-200 ease-in-out shadow-md">
          Back to Course
        </Link>
      </div>
    </div>
  )
}