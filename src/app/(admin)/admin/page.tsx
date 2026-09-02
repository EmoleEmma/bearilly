'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, BarChart2, BookOpen, FileText, Activity,
  Plus, FilePlus2, ClipboardCheck, Layers,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FeedItem = {
  id: string
  type: 'signup' | 'quiz' | 'submission'
  label: string
  detail: string
  at: string
}

type TrackRevenue = {
  name: string
  paidUsers: number
  revenueNaira: number
}

function daysAgoLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function last14DayLabels() {
  const labels: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toISOString().slice(0, 10))
  }
  return labels
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activatedUsers: 0,
    quizAttempts: 0,
    submissions: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [signupSeries, setSignupSeries] = useState<number[]>([])
  const [trackRevenue, setTrackRevenue] = useState<TrackRevenue[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const [
      usersRes,
      activatedRes,
      quizRes,
      submissionsRes,
      recentUsersRes,
      pendingSubsRes,
      signupWindowRes,
      schoolsRes,
      recentQuizRes,
      recentSubsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_activated', true),
      supabase.from('quiz_results').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id, full_name, is_activated, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('submissions').select('id, assessments(title)').eq('status', 'submitted').order('submission_date', { ascending: false }).limit(5),
      supabase.from('profiles').select('created_at').gte('created_at', fourteenDaysAgo.toISOString()),
      supabase.from('schools').select('id, name, price_kobo'),
      supabase.from('quiz_results').select('id, category, passed, taken_at, profiles(full_name)').order('taken_at', { ascending: false }).limit(5),
      supabase.from('submissions').select('id, submission_date, profiles(full_name), assessments(title)').order('submission_date', { ascending: false }).limit(5),
    ])

    setStats({
      totalUsers: usersRes.count || 0,
      activatedUsers: activatedRes.count || 0,
      quizAttempts: quizRes.count || 0,
      submissions: submissionsRes.count || 0,
    })
    setRecentUsers(recentUsersRes.data || [])
    setPendingSubmissions(pendingSubsRes.data || [])

    // Build a real 14-day signup histogram from actual created_at values
    const labels = last14DayLabels()
    const counts = labels.map(day =>
      (signupWindowRes.data || []).filter(p => p.created_at.slice(0, 10) === day).length
    )
    setSignupSeries(counts)

    // Revenue by track: activated users per school × that school's price
    if (schoolsRes.data) {
      const { data: profilesWithSchool } = await supabase
        .from('profiles')
        .select('school_id, is_activated')
        .eq('is_activated', true)

      const revenue: TrackRevenue[] = schoolsRes.data.map((s: any) => {
        const paidUsers = (profilesWithSchool || []).filter(p => p.school_id === s.id).length
        return {
          name: s.name,
          paidUsers,
          revenueNaira: (paidUsers * s.price_kobo) / 100,
        }
      })
      setTrackRevenue(revenue)
    }

    // Merge recent signups, quiz completions, and submissions into one feed
    const feedItems: FeedItem[] = []

    ;(recentUsersRes.data || []).slice(0, 4).forEach((u: any) => {
      feedItems.push({
        id: `signup-${u.id}`,
        type: 'signup',
        label: `${u.full_name || 'A new user'} signed up`,
        detail: u.is_activated ? 'Activated' : 'Pending payment',
        at: u.created_at,
      })
    })
    ;(recentQuizRes.data || []).forEach((q: any) => {
      feedItems.push({
        id: `quiz-${q.id}`,
        type: 'quiz',
        label: `${q.profiles?.full_name || 'A user'} took a quiz`,
        detail: `${q.category} — ${q.passed ? 'Passed' : 'Failed'}`,
        at: q.taken_at,
      })
    })
    ;(recentSubsRes.data || []).forEach((s: any) => {
      feedItems.push({
        id: `sub-${s.id}`,
        type: 'submission',
        label: `${s.profiles?.full_name || 'A user'} submitted work`,
        detail: s.assessments?.title || 'Untitled assessment',
        at: s.submission_date,
      })
    })

    feedItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    setFeed(feedItems.slice(0, 8))

    setLoading(false)
  }

  const statCards = [
    { label: 'Total Users',   value: stats.totalUsers,     icon: Users,     color: '#2DD4BF' },
    { label: 'Activated',     value: stats.activatedUsers, icon: Activity,  color: '#34D399' },
    { label: 'Quizzes Taken', value: stats.quizAttempts,   icon: BarChart2, color: '#A78BFA' },
    { label: 'Submissions',   value: stats.submissions,    icon: BookOpen,  color: '#F0A500' },
  ]

  const maxSignup = Math.max(...signupSeries, 1)
  const maxRevenue = Math.max(...trackRevenue.map(t => t.revenueNaira), 1)

  const quickActions = [
    { label: 'New Track', href: '/admin/tracks', icon: Plus },
    { label: 'Add Content', href: '/admin/content', icon: FilePlus2 },
    { label: 'Review Submissions', href: '/admin/submissions', icon: ClipboardCheck },
    { label: 'Manage Tracks', href: '/admin/tracks', icon: Layers },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Platform management dashboard</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-4 relative" style={{ background: '#334155' }}>
            <div className="absolute top-3 right-3 p-1.5 rounded-lg" style={{ background: '#1E293B' }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-3xl font-bold mt-1" style={{ color }}>{loading ? '—' : value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#94A3B8' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:brightness-110"
            style={{ background: '#1E293B', color: '#E2E8F0' }}
          >
            <Icon size={16} style={{ color: '#2DD4BF' }} />
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Signup chart — real data, last 14 days */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Signups — Last 14 Days</p>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="h-32 animate-pulse rounded" style={{ background: '#334155' }} />
            ) : signupSeries.every(c => c === 0) ? (
              <div className="h-32 flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
                No signups in the last 14 days yet.
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-32">
                {signupSeries.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max((count / maxSignup) * 100, count > 0 ? 6 : 2)}%`,
                        background: count > 0 ? '#2DD4BF' : '#334155',
                      }}
                      title={`${count} signup${count === 1 ? '' : 's'}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by track — real data from schools + activated profiles */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Revenue by Track</p>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <div className="h-32 animate-pulse rounded" style={{ background: '#334155' }} />
            ) : trackRevenue.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm" style={{ color: '#94A3B8' }}>
                No tracks yet.
              </div>
            ) : (
              trackRevenue.map(t => (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                    <p className="text-xs font-bold" style={{ color: '#2DD4BF' }}>
                      ₦{t.revenueNaira.toLocaleString('en-NG')} · {t.paidUsers} paid
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max((t.revenueNaira / maxRevenue) * 100, t.revenueNaira > 0 ? 4 : 0)}%`,
                        background: '#2DD4BF',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity feed — merged real events */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Recent Activity</p>
          </div>
          <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 rounded animate-pulse" style={{ background: '#334155' }} />)
            ) : feed.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#94A3B8' }}>
                <Activity size={24} className="mx-auto mb-2 opacity-40" /><p>No recent activity.</p>
              </div>
            ) : feed.map(item => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: '#33415540' }}>
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{
                    background: item.type === 'signup' ? '#2DD4BF' : item.type === 'quiz' ? '#A78BFA' : '#F0A500',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.label}</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>{item.detail}</p>
                </div>
                <p className="text-[11px] shrink-0" style={{ color: '#64748B' }}>{daysAgoLabel(item.at)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Review — kept from original, still real data */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Needs Review</p>
            <Link href="/admin/submissions" className="text-xs font-bold underline" style={{ color: '#0F172A' }}>
              View all
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#94A3B8' }}>
                <FileText size={24} className="mx-auto mb-2 opacity-40" /><p>Nothing pending review.</p>
              </div>
            ) : pendingSubmissions.map((s, i) => (
              <Link
                href="/admin/submissions"
                key={i}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors hover:brightness-110"
                style={{ background: '#334155' }}
              >
                <p className="text-sm text-white">{s.assessments?.title || 'Untitled'}</p>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#1C3A4A', color: '#2DD4BF' }}>New</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
