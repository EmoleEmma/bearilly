'use client'

import { useEffect, useState } from 'react'
import { Users, BarChart2, BookOpen, FileText, TrendingUp, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    quizAttempts: 0,
    assessments: 0,
    submissions: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const [usersRes, quizRes, assessmentsRes, submissionsRes, recentUsersRes, pendingSubsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('quiz_results').select('id', { count: 'exact', head: true }),
      supabase.from('assessments').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('full_name, is_activated').order('created_at', { ascending: false }).limit(5),
      supabase.from('submissions').select('id, assessments(title)').eq('status', 'submitted').order('submission_date', { ascending: false }).limit(5),
    ])

    setStats({
      totalUsers: usersRes.count || 0,
      quizAttempts: quizRes.count || 0,
      assessments: assessmentsRes.count || 0,
      submissions: submissionsRes.count || 0,
    })
    setRecentUsers(recentUsersRes.data || [])
    setPendingSubmissions(pendingSubsRes.data || [])
    setLoading(false)
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Quiz Attempts', value: stats.quizAttempts },
    { label: 'Assessments', value: stats.assessments },
    { label: 'Submissions', value: stats.submissions },
  ] as const

  const statCards = [
    { label: 'Total Users',       value: stats.totalUsers,    icon: Users,     color: '#2DD4BF' },
    { label: 'Active Users',      value: stats.totalUsers,    icon: Activity,  color: '#34D399' },
    { label: 'Quizzes Taken',     value: stats.quizAttempts,  icon: BarChart2, color: '#A78BFA' },
    { label: 'Assessments',       value: stats.assessments,   icon: BookOpen,  color: '#F0A500' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Platform management dashboard</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Users Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Recent Users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Name', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr><td colSpan={2} className="px-5 py-8 text-center" style={{ color: '#94A3B8' }}>
                    <Users size={24} className="mx-auto mb-2 opacity-40" /><p>No users yet.</p>
                  </td></tr>
                ) : recentUsers.map((u, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#0F172A22', borderBottom: '1px solid #33415540' }}>
                    <td className="px-5 py-3 text-white font-medium">{u.full_name || 'Unnamed user'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: u.is_activated ? '#064E3B' : '#451A03', color: u.is_activated ? '#34D399' : '#F59E0B' }}>
                        {u.is_activated ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Review */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="px-5 py-3.5" style={{ background: '#2DD4BF' }}>
            <p className="text-sm font-bold" style={{ color: '#0F172A' }}>Needs Review</p>
          </div>
          <div className="p-5 space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#94A3B8' }}>
                <FileText size={24} className="mx-auto mb-2 opacity-40" /><p>Nothing pending review.</p>
              </div>
            ) : pendingSubmissions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{ background: '#334155' }}>
                <p className="text-sm text-white">{s.assessments?.title || 'Untitled'}</p>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#1C3A4A', color: '#2DD4BF' }}>New</span>
              </div>
            ))}
          </div>

          {/* Chart placeholders */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-5">
            {['User Growth', 'Quiz Activity'].map(label => (
              <div key={label} className="rounded-lg p-3" style={{ background: '#334155' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: '#2DD4BF' }}>{label}</p>
                <div className="h-16 rounded" style={{ background: '#1E293B', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}