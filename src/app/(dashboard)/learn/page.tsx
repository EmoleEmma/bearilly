'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { name: 'Content Creation', slug: 'content-creation', emoji: '📸', color: '#FF6B6B', bg: '#FFF0F0' },
  { name: 'Digital Marketing', slug: 'digital-marketing', emoji: '📢', color: '#4ECDC4', bg: '#F0FFFE' },
  { name: 'Entrepreneurship', slug: 'entrepreneurship', emoji: '💡', color: '#F0A500', bg: '#FFFBF0' },
  { name: 'Career Development', slug: 'career-development', emoji: '🚀', color: '#667eea', bg: '#F0F0FF' },
  { name: 'Business Skills', slug: 'business-skills', emoji: '💼', color: '#10B981', bg: '#F0FFF8' },
  { name: 'Productivity', slug: 'productivity', emoji: '⚡', color: '#8B5CF6', bg: '#F5F0FF' },
  { name: 'Technology', slug: 'technology', emoji: '💻', color: '#3B82F6', bg: '#F0F6FF' },
  { name: 'Financial Literacy', slug: 'financial-literacy', emoji: '💰', color: '#059669', bg: '#F0FFF8' },
]

type ProgressMap = Record<string, { total: number; completed: number }>

export default function LearnPage() {
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user){ 
        return;
      }

      // Get all lessons grouped by category
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, category')
        .order('order_index')

      // Get user's completed lessons
      const { data: progress } = await supabase
        .from('progress')
        .select('lesson_id, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const completedIds = new Set((progress || []).map(p => p.lesson_id))

      const map: ProgressMap = {}
      for (const cat of categories) {
        const catLessons = (lessons || []).filter(l => 
  l.category.toLowerCase() === cat.name.toLowerCase()
)
        const completed = catLessons.filter(l => completedIds.has(l.id)).length
        map[cat.slug] = { total: catLessons.length, completed }
      }
      setProgressMap(map)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1E293B', margin: '0 0 6px' }}>
          📚 Learning Hub
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
          Choose a category to start learning. Complete all lessons to unlock the category test.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {categories.map(cat => {
          const prog = progressMap[cat.slug]
          const total = prog?.total ?? 0
          const completed = prog?.completed ?? 0
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0
          const isDone = total > 0 && completed === total

          return (
            <Link key={cat.slug} href={`/learn/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: cat.bg,
                border: `2px solid ${isDone ? cat.color : cat.color + '30'}`,
                borderRadius: '18px',
                padding: '24px 18px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {isDone && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: cat.color, color: 'white',
                    borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                    padding: '2px 8px',
                  }}>✓ Done</div>
                )}
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{cat.emoji}</div>
                <p style={{ color: cat.color, fontWeight: 'bold', fontSize: '14px', margin: '0 0 10px' }}>
                  {cat.name}
                </p>

                {/* Progress bar */}
                {!loading && total > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ background: '#E2E8F0', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        background: cat.color, height: '100%',
                        width: `${pct}%`, borderRadius: '10px',
                        transition: 'width 0.4s',
                      }} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '6px 0 0' }}>
                      {completed}/{total} lessons
                    </p>
                  </div>
                )}
                {!loading && total === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '8px 0 0' }}>Coming soon</p>
                )}
                {loading && (
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', marginTop: '8px' }} />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
