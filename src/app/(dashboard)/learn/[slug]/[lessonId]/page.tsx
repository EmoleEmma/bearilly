'use client'

import { useEffect, useState } from 'react'
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

type Lesson = {
  id: string
  title: string
  description: string
  content: string
  example: string
  order_index: number
  category: string
}

type NextLesson = {
  id: string
  title: string
  description?: string
  order_index: number
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const cat = categoryMap[slug]

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [lessonId])

  async function load() {
    try {
      setLoading(true)
      setError('')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get this lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (lessonError || !lessonData) {
        setError('Lesson not found')
        router.push(`/learn/${slug}`)
        return
      }

      setLesson(lessonData)

      // Get next lesson
      const { data: nextData } = await supabase
        .from('lessons')
        .select('id, title, description, order_index')
        .eq('category', lessonData.category)
        .gt('order_index', lessonData.order_index)
        .order('order_index')
        .limit(1)
        .maybeSingle()

      setNextLesson(nextData)

      // Check progress
      const { data: prog } = await supabase
        .from('progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      setIsCompleted(prog?.status === 'completed')

      // Mark as started
      if (!prog) {
        await supabase.from('progress').upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'started',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
      }
    } catch (err) {
      console.error('Lesson load error:', err)
      setError('Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  async function markComplete() {
    if (!lessonId || marking) return
    setMarking(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })

      setIsCompleted(true)
    } catch (err) {
      console.error('Mark complete error:', err)
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
        Loading lesson…
      </div>
    )
  }

  if (error || !lesson || !cat) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#ef4444' }}>{error || 'Lesson not found'}</p>
        <Link href={`/learn/${slug}`} style={{ color: '#3b82f6', marginTop: '20px', display: 'inline-block' }}>
          ← Back to Category
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
        <Link href="/learn" style={{ color: '#64748b', textDecoration: 'none' }}>Learning Hub</Link>
        <span>›</span>
        <Link href={`/learn/${slug}`} style={{ color: '#64748b', textDecoration: 'none' }}>{cat.name}</Link>
        <span>›</span>
        <span style={{ color: '#1E293B', fontWeight: '600' }}>{lesson.title}</span>
      </div>

      {/* Lesson Header */}
      <div style={{
        background: `linear-gradient(135deg, ${cat.color}20, ${cat.color}10)`,
        border: `2px solid ${cat.color}30`,
        borderRadius: '20px', 
        padding: '28px', 
        marginBottom: '28px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: cat.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {cat.emoji} {cat.name}
        </span>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1E293B', margin: '12px 0 0' }}>
          {lesson.title}
        </h1>
        {isCompleted && (
          <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#D1FAE5', color: '#065F46', borderRadius: '9999px', padding: '4px 16px', fontSize: '13px', fontWeight: '600' }}>
            ✓ Completed
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', marginBottom: '16px' }}>📖 Lesson Content</h2>
        <div style={{ color: '#374151', fontSize: '16px', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
          {lesson.content}
        </div>
      </div>

      {/* Example */}
      {lesson.example && (
        <div style={{
          background: `${cat.color}10`, 
          border: `1px solid ${cat.color}30`,
          borderRadius: '16px', 
          padding: '28px', 
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: cat.color, marginBottom: '14px' }}>
            💡 Real-Life Example
          </h2>
          <p style={{ color: '#374151', fontSize: '15.5px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {lesson.example}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!isCompleted ? (
          <button
            onClick={markComplete}
            disabled={marking}
            style={{
              background: cat.color, 
              color: 'white', 
              border: 'none',
              padding: '14px 32px', 
              borderRadius: '12px', 
              fontWeight: 'bold',
              fontSize: '16px', 
              cursor: marking ? 'not-allowed' : 'pointer',
              opacity: marking ? 0.75 : 1,
            }}
          >
            {marking ? 'Saving...' : '✓ Mark as Complete'}
          </button>
        ) : nextLesson ? (
          <Link
            href={`/learn/${slug}/${nextLesson.id}`}
            style={{
              background: cat.color, 
              color: 'white', 
              textDecoration: 'none',
              padding: '14px 32px', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              fontSize: '16px',
            }}
          >
            Next Lesson → {nextLesson.title}
          </Link>
        ) : (
          <Link
            href={`/learn/${slug}`}
            style={{
              background: cat.color, 
              color: 'white', 
              textDecoration: 'none',
              padding: '14px 32px', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              fontSize: '16px',
            }}
          >
            ← Back to Category
          </Link>
        )}

        <Link
          href={`/learn/${slug}`}
          style={{
            background: 'white', 
            color: '#64748b', 
            textDecoration: 'none',
            padding: '14px 24px', 
            borderRadius: '12px', 
            fontWeight: '600', 
            fontSize: '15px',
            border: '1px solid #E2E8F0',
          }}
        >
          Back to {cat.name}
        </Link>
      </div>
    </div>
  )
}