'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.email || 'Creator'
      setUserName(name.split(' ')[0])
      setLoading(false)
    })
  }, [])

  const courseCategories = [
    { name: 'Content Creation', emoji: '📸', color: '#FF6B6B', bg: '#FFF0F0' },
    { name: 'Digital Marketing', emoji: '📢', color: '#4ECDC4', bg: '#F0FFFE' },
    { name: 'Entrepreneurship', emoji: '💡', color: '#F0A500', bg: '#FFFBF0' },
    { name: 'Career Development', emoji: '🚀', color: '#667eea', bg: '#F0F0FF' },
    { name: 'Business Skills', emoji: '💼', color: '#10B981', bg: '#F0FFF8' },
    { name: 'Productivity', emoji: '⚡', color: '#8B5CF6', bg: '#F5F0FF' },
    { name: 'Technology', emoji: '💻', color: '#3B82F6', bg: '#F0F6FF' },
    { name: 'Financial Literacy', emoji: '💰', color: '#059669', bg: '#F0FFF8' },
  ]

  const interfaces = [
    { label: 'Learning Hub', href: '/learn', emoji: '📚', color: '#667eea', bg: '#F0F0FF', desc: 'Start or continue your courses' },
    { label: 'Bearilly AI Guide', href: '/ai-tutor', emoji: '🤖', color: '#10B981', bg: '#F0FFF8', desc: 'Get help navigating the app' },
    { label: 'Assessments', href: '/assessments', emoji: '📝', color: '#F0A500', bg: '#FFFBF0', desc: 'Take tests and see your scores' },
    { label: 'Opportunities', href: '/toolkit', emoji: '🌟', color: '#8B5CF6', bg: '#F5F0FF', desc: 'Internships, competitions and programs' },
    { label: 'My Profile', href: '/profile', emoji: '👤', color: '#EF4444', bg: '#FFF0F0', desc: 'View your progress and courses' },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', padding: '32px', marginBottom: '28px', color: 'white' }}>
        <p style={{ fontSize: '15px', opacity: 0.85, margin: '0 0 6px' }}>Hello Welcome! 👋👋</p>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px' }}>
          {loading ? '...' : `Good to see you, ${userName}!`}
        </h1>
        <p style={{ fontSize: '15px', opacity: 0.85, margin: 0 }}>What would you like to do today?</p>
      </div>

      {/* Main Interfaces */}
      <h2 style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '18px', marginBottom: '14px' }}>Platform Sections</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {interfaces.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: item.bg, borderRadius: '16px', padding: '20px 16px', border: `2px solid ${item.color}25`, textAlign: 'center', height: '100%' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>{item.emoji}</div>
              <p style={{ color: item.color, fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px' }}>{item.label}</p>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Learning Hub Preview */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '18px', margin: 0 }}>📚 Learning Hub</h2>
          <Link href="/learn" style={{ color: '#667eea', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>What course would you like to study today?</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {courseCategories.map((cat) => (
            <Link key={cat.name} href="/learn" style={{ textDecoration: 'none' }}>
              <div style={{ background: cat.bg, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${cat.color}20` }}>
                <span style={{ fontSize: '28px' }}>{cat.emoji}</span>
                <div>
                  <p style={{ color: cat.color, fontWeight: '600', fontSize: '13px', margin: '0 0 4px' }}>{cat.name}</p>
                  <span style={{ background: cat.color, color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold' }}>Start Course</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Guide + Assessments Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* AI Guide */}
        <Link href="/ai-tutor" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '20px', padding: '24px', color: 'white', height: '100%' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤖</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 8px' }}>Bearilly AI Guide</h3>
            <p style={{ opacity: 0.85, fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Hello I&apos;m Bearilly AI. Ask me anything about the app or your courses.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold' }}>
              Chat Now →
            </div>
          </div>
        </Link>

        {/* Assessments */}
        <Link href="/assessments" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'linear-gradient(135deg, #F0A500, #f59e0b)', borderRadius: '20px', padding: '24px', color: 'white', height: '100%' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 8px' }}>Assessment Center</h3>
            <p style={{ opacity: 0.85, fontSize: '13px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Take tests after completing courses. Each test is 20 questions in 5 minutes.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 'bold' }}>
              View Tests →
            </div>
          </div>
        </Link>
      </div>

      {/* Opportunities */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '18px', margin: 0 }}>🌟 Opportunities</h2>
          <Link href="/toolkit" style={{ color: '#8B5CF6', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>Explore →</Link>
        </div>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>Here are awesome opportunities for you 😊</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Organizations', emoji: '🏢', color: '#667eea', bg: '#F0F0FF', desc: 'Companies and institutions' },
            { label: 'Internships', emoji: '💼', color: '#10B981', bg: '#F0FFF8', desc: 'Real-world work experience' },
            { label: 'Competitions', emoji: '🏆', color: '#F0A500', bg: '#FFFBF0', desc: 'Contests and challenges' },
            { label: 'Programs', emoji: '🎓', color: '#8B5CF6', bg: '#F5F0FF', desc: 'Scholarships and fellowships' },
          ].map((opp) => (
            <Link key={opp.label} href="/toolkit" style={{ textDecoration: 'none' }}>
              <div style={{ background: opp.bg, borderRadius: '14px', padding: '16px', border: `1px solid ${opp.color}20`, textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{opp.emoji}</div>
                <p style={{ color: opp.color, fontWeight: 'bold', fontSize: '13px', margin: '0 0 4px' }}>{opp.label}</p>
                <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>{opp.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Progress / Profile strip */}
      <Link href="/profile" style={{ textDecoration: 'none' }}>
        <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #2E75B6)', borderRadius: '20px', padding: '24px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', background: '#F0A500', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px' }}>My Profile & Progress</p>
            <p style={{ opacity: 0.8, fontSize: '13px', margin: 0 }}>View your completed courses, active courses and progress</p>
          </div>
          <span style={{ fontSize: '24px', opacity: 0.7 }}>→</span>
        </div>
      </Link>

    </div>
  )
}