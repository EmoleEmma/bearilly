'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const categoryMap: Record<string, { name: string; emoji: string; color: string }> = {
  'content-creation':   { name: 'Content Creation',   emoji: '📸', color: '#FF6B6B' },
  'digital-marketing':  { name: 'Digital Marketing',   emoji: '📢', color: '#4ECDC4' },
  'entrepreneurship':   { name: 'Entrepreneurship',    emoji: '💡', color: '#F0A500' },
  'career-development': { name: 'Career Development',  emoji: '🚀', color: '#667eea' },
  'business-skills':    { name: 'Business Skills',     emoji: '💼', color: '#10B981' },
  'productivity':       { name: 'Productivity',        emoji: '⚡', color: '#8B5CF6' },
  'technology':         { name: 'Technology',          emoji: '💻', color: '#3B82F6' },
  'financial-literacy': { name: 'Financial Literacy',  emoji: '💰', color: '#059669' },
}

type Question = {
  id: string
  question: string
  options: string[]
  answer: string
}

type Phase = 'loading' | 'not_ready' | 'intro' | 'active' | 'result'

const TOTAL_MARKS = 100
const MARKS_PER_Q = 5
const TIME_SECONDS = 300 // 5 minutes

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!cat) { router.push('/learn'); return }
    checkReadiness()
  }, [slug])

  async function checkReadiness() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check all lessons in category are completed
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('category', cat.name)

    const { data: progress } = await supabase
      .from('progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const completedIds = new Set((progress || []).map(p => p.lesson_id))
    const allDone = (lessons || []).every(l => completedIds.has(l.id)) && (lessons?.length ?? 0) > 0

    if (!allDone) { setPhase('not_ready'); return }

    // Load quiz questions for this category's lessons
    const lessonIds = (lessons || []).map(l => l.id)
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, question, options, answer')
      .in('lesson_id', lessonIds)

    // Shuffle and take 20
    const shuffled = (quizData || []).sort(() => Math.random() - 0.5).slice(0, 20)
    setQuestions(shuffled.map(q => ({
      ...q,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
    })))
    setPhase('intro')
  }

  function startTest() {
    setPhase('active')
    setTimeLeft(TIME_SECONDS)
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

  function next() {
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else submitTest()
  }

  function submitTest() {
    if (timerRef.current) clearInterval(timerRef.current)
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++
    })
    setScore(correct * MARKS_PER_Q)
    setPhase('result')
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')
  const timerColor = timeLeft < 60 ? '#EF4444' : cat?.color

  if (!cat) return null

  // NOT READY
  if (phase === 'not_ready') return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 12px' }}>
        Complete All Lessons First
      </h2>
      <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7, margin: '0 0 28px' }}>
        You need to finish all lessons in <strong>{cat.name}</strong> before taking the test.
      </p>
      <Link href={`/learn/${slug}`} style={{
        background: cat.color, color: 'white', textDecoration: 'none',
        padding: '14px 32px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px',
      }}>
        Back to Lessons
      </Link>
    </div>
  )

  // LOADING
  if (phase === 'loading') return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
      Preparing test…
    </div>
  )

  // INTRO
  if (phase === 'intro') return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>{cat.emoji}</div>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 12px' }}>
        {cat.name} Test
      </h1>
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '28px', margin: '24px 0', textAlign: 'left' }}>
        {[
          ['📝', 'Questions', `${questions.length} multiple choice questions`],
          ['⏱️', 'Time Limit', '5 minutes (300 seconds)'],
          ['🏆', 'Marks', `${MARKS_PER_Q} marks per correct answer`],
          ['💯', 'Total', `${TOTAL_MARKS} marks maximum`],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>{icon} {label}</span>
            <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '14px' }}>{val}</span>
          </div>
        ))}
      </div>
      <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>
        Once you start, the timer begins immediately. Answer all questions before time runs out.
      </p>
      <button
        onClick={startTest}
        style={{
          background: cat.color, color: 'white', border: 'none',
          padding: '16px 48px', borderRadius: '14px', fontWeight: 'bold',
          fontSize: '18px', cursor: 'pointer',
        }}
      >
        Start Test →
      </button>
    </div>
  )

  // ACTIVE TEST
  if (phase === 'active') {
    const q = questions[current]
    const selected = answers[current]
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Timer + progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', color: '#64748b', fontSize: '14px' }}>
            Question {current + 1} of {questions.length}
          </div>
          <div style={{
            fontWeight: 'bold', fontSize: '22px', color: timerColor,
            background: `${timerColor}15`, padding: '8px 18px', borderRadius: '12px',
          }}>
            ⏱ {mins}:{secs}
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: '#E2E8F0', borderRadius: '10px', height: '6px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ background: cat.color, height: '100%', width: `${((current + 1) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>

        {/* Question */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: 0, lineHeight: 1.6 }}>
            {q.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(opt)}
              style={{
                background: selected === opt ? cat.color : 'white',
                color: selected === opt ? 'white' : '#1E293B',
                border: `2px solid ${selected === opt ? cat.color : '#E2E8F0'}`,
                borderRadius: '12px', padding: '16px 20px',
                textAlign: 'left', cursor: 'pointer', fontSize: '15px',
                fontWeight: selected === opt ? '600' : '400',
                transition: 'all 0.15s',
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={!selected}
          style={{
            background: selected ? cat.color : '#E2E8F0',
            color: selected ? 'white' : '#94a3b8',
            border: 'none', padding: '14px 32px', borderRadius: '12px',
            fontWeight: 'bold', fontSize: '16px', cursor: selected ? 'pointer' : 'not-allowed',
            float: 'right',
          }}
        >
          {current === questions.length - 1 ? 'Submit Test' : 'Next →'}
        </button>
      </div>
    )
  }

  // RESULT
  const passed = score >= 50
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '72px', marginBottom: '16px' }}>{passed ? '🏆' : '😔'}</div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 8px' }}>
        {passed ? 'Well Done!' : 'Keep Practising!'}
      </h1>
      <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 28px' }}>
        {cat.name} Test Complete
      </p>

      <div style={{
        background: passed ? '#F0FFF8' : '#FFF0F0',
        border: `3px solid ${passed ? '#10B981' : '#EF4444'}`,
        borderRadius: '20px', padding: '36px', marginBottom: '28px',
      }}>
        <p style={{ fontSize: '64px', fontWeight: 'bold', color: passed ? '#10B981' : '#EF4444', margin: '0 0 8px' }}>
          {score}/{TOTAL_MARKS}
        </p>
        <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
          {Math.round(score / MARKS_PER_Q)} out of {questions.length} correct
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!passed && (
          <button
            onClick={() => { setPhase('intro'); setAnswers({}); setCurrent(0) }}
            style={{
              background: cat.color, color: 'white', border: 'none',
              padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold',
              fontSize: '15px', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        )}
        <Link href={`/learn/${slug}`} style={{
          background: 'white', color: '#1E293B', textDecoration: 'none',
          padding: '14px 28px', borderRadius: '12px', fontWeight: '600',
          fontSize: '15px', border: '1px solid #E2E8F0',
        }}>
          Back to Lessons
        </Link>
        <Link href="/learn" style={{
          background: '#1E3A5F', color: 'white', textDecoration: 'none',
          padding: '14px 28px', borderRadius: '12px', fontWeight: '600', fontSize: '15px',
        }}>
          Learning Hub
        </Link>
      </div>
    </div>
  )
}
