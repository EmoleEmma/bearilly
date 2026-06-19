'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const categoryMap: Record<string, { name: string; emoji: string; color: string; bg: string }> = {
  'content-creation':   { name: 'Content Creation',   emoji: '📸', color: '#FF6B6B', bg: '#FFF0F0' },
  'digital-marketing':  { name: 'Digital Marketing',   emoji: '📢', color: '#4ECDC4', bg: '#F0FFFE' },
  'entrepreneurship':   { name: 'Entrepreneurship',    emoji: '💡', color: '#F0A500', bg: '#FFFBF0' },
  'career-development': { name: 'Career Development',  emoji: '🚀', color: '#667eea', bg: '#F0F0FF' },
  'business-skills':    { name: 'Business Skills',     emoji: '💼', color: '#10B981', bg: '#F0FFF8' },
  'productivity':       { name: 'Productivity',        emoji: '⚡', color: '#8B5CF6', bg: '#F5F0FF' },
  'technology':         { name: 'Technology',          emoji: '💻', color: '#3B82F6', bg: '#F0F6FF' },
  'financial-literacy': { name: 'Financial Literacy',  emoji: '💰', color: '#059669', bg: '#F0FFF8' },
}

type Lesson = {
  id: string
  title: string
  description: string
  order_index: number
  status?: 'not_started' | 'started' | 'completed'
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const cat = categoryMap[slug]

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)
  const [showGuidance, setShowGuidance] = useState(false)
  const [pendingLesson, setPendingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!cat) { router.push('/learn'); return }
    load()
  }, [slug])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)   // ← ADD THIS
      return
    }
    const { data: rawLessons } = await supabase
      .from('lessons')
      .select('id, title, description, order_index')
      .eq('category', cat.name)
      .order('order_index')

    const { data: progress } = await supabase
      .from('progress')
      .select('lesson_id, status')
      .eq('user_id', user.id)

    const progressMap = Object.fromEntries((progress || []).map(p => [p.lesson_id, p.status]))

    const enriched: Lesson[] = (rawLessons || []).map(l => ({
      ...l,
      status: progressMap[l.id] as Lesson['status'] ?? 'not_started',
    }))

    setLessons(enriched)
    setAllDone(enriched.length > 0 && enriched.every(l => l.status === 'completed'))
    setLoading(false)
  }

  function handleLessonClick(lesson: Lesson) {
    if (lesson.status === 'completed') {
      router.push(`/learn/${slug}/${lesson.id}`)
      return
    }
    // Show guidance message before starting
    setPendingLesson(lesson)
    setShowGuidance(true)
  }

  function proceedToLesson() {
    if (pendingLesson) {
      router.push(`/learn/${slug}/${pendingLesson.id}`)
    }
    setShowGuidance(false)
  }

  if (!cat) return null

  const completed = lessons.filter(l => l.status === 'completed').length
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Guidance Modal */}
      {showGuidance && pendingLesson && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '36px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{cat.emoji}</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 12px' }}>
              Before You Begin
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7, margin: '0 0 24px' }}>
              You&apos;re about to start <strong>{pendingLesson.title}</strong>. Take your time reading each section carefully.
              After completing all lessons in this category, you&apos;ll unlock the category test.
              Good luck! 🎯
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowGuidance(false)}
                style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}
              >
                Not Yet
              </button>
              <button
                onClick={proceedToLesson}
                style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: cat.color, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
              >
                Start Lesson →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/learn" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Learning Hub
        </Link>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${cat.color}, ${cat.color}99)`,
        borderRadius: '20px', padding: '32px', color: 'white', marginBottom: '28px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{cat.emoji}</div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px' }}>{cat.name}</h1>
        <p style={{ opacity: 0.9, fontSize: '14px', margin: '0 0 16px' }}>
          {lessons.length} lessons · {completed} completed
        </p>
        <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
          <div style={{ background: 'white', height: '100%', width: `${pct}%`, borderRadius: '10px', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* All done — show Take a Test button */}
      {allDone && (
        <div style={{
          background: '#F0FFF8', border: '2px solid #10B981', borderRadius: '16px',
          padding: '24px', textAlign: 'center', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏆</div>
          <h3 style={{ fontWeight: 'bold', color: '#065F46', fontSize: '18px', margin: '0 0 8px' }}>
            All Lessons Completed!
          </h3>
          <p style={{ color: '#047857', fontSize: '14px', margin: '0 0 16px' }}>
            You&apos;ve finished all lessons in this category. Ready to take the test?
          </p>
          <Link href={`/learn/${slug}/test`} style={{
            display: 'inline-block', background: '#10B981', color: 'white',
            padding: '14px 32px', borderRadius: '12px', textDecoration: 'none',
            fontWeight: 'bold', fontSize: '16px',
          }}>
            Take the Test 📝
          </Link>
        </div>
      )}

      {/* Lessons list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading lessons…</div>
      ) : lessons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <p style={{ fontSize: '32px' }}>🚧</p>
          <p>Lessons coming soon for this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lessons.map((lesson, i) => {
            const isCompleted = lesson.status === 'completed'
            const isStarted = lesson.status === 'started'

            return (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                style={{
                  background: 'white', borderRadius: '14px', padding: '20px 24px',
                  border: `2px solid ${isCompleted ? cat.color : '#E2E8F0'}`,
                  display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'border-color 0.2s',
                }}
              >
                {/* Number / check */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: isCompleted ? cat.color : isStarted ? cat.color + '20' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCompleted ? '18px' : '15px',
                  fontWeight: 'bold', color: isCompleted ? 'white' : cat.color,
                }}>
                  {isCompleted ? '✓' : i + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', color: '#1E293B', margin: '0 0 3px', fontSize: '15px' }}>
                    {lesson.title}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                    {lesson.description}
                  </p>
                </div>

                <div style={{
                  fontSize: '13px', fontWeight: 'bold', color: 'white',
                  background: isCompleted ? cat.color : isStarted ? cat.color : '#94a3b8',
                  padding: '6px 14px', borderRadius: '20px', flexShrink: 0,
                }}>
                  {isCompleted ? 'Review' : isStarted ? 'Continue' : 'Start'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
