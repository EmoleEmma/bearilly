'use client'

import { useEffect, useState } from 'react'
import { Trophy, Users, TrendingUp, Target, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

type QuizResult = {
  id: string
  category: string
  score: number
  total: number
  passed: boolean
  attempt_number: number
  taken_at: string
  user_id: string
  profiles: {
    full_name: string
    email: string
  } | null
}

type CategoryStat = {
  category: string
  totalAttempts: number
  uniqueUsers: number
  passCount: number
  passRate: number
  avgScore: number
  highestScore: number
}

export default function AdminQuizzesPage() {
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')
  const [filterCategory, setFilterCategory] = useState('All')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/quiz/results?scope=all')
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to load quiz results')
      }
      const json = await res.json()
      setResults(json.results || [])
    } catch (err: any) {
      console.error('Admin quiz results error:', err)
      setError(err.message || 'Could not load quiz results.')
    } finally {
      setLoading(false)
    }
  }

  // Global stats
  const totalAttempts = results.length
  const totalPassed = results.filter(r => r.passed).length
  const uniqueUsers = new Set(results.map(r => r.user_id)).size
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0
  const scores = results.map(r => Math.round((r.score / r.total) * 100))
  const overallAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  // Per-category stats
  const categories = Array.from(new Set(results.map(r => r.category))).sort()
  const categoryStats: CategoryStat[] = categories.map(cat => {
    const catResults = results.filter(r => r.category === cat)
    const catScores = catResults.map(r => Math.round((r.score / r.total) * 100))
    const passed = catResults.filter(r => r.passed).length
    return {
      category: cat,
      totalAttempts: catResults.length,
      uniqueUsers: new Set(catResults.map(r => r.user_id)).size,
      passCount: passed,
      passRate: catResults.length > 0 ? Math.round((passed / catResults.length) * 100) : 0,
      avgScore: catScores.length > 0 ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : 0,
      highestScore: catScores.length > 0 ? Math.max(...catScores) : 0,
    }
  })

  const filterOptions = ['All', ...categories]
  const filteredHistory = filterCategory === 'All'
    ? results
    : results.filter(r => r.category === filterCategory)

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Quiz Management</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Analytics, attempts, and pass rates for all quizzes.</p>
      </div>

      {/* Global stat chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: Trophy,       label: 'Total Attempts', value: loading ? '—' : totalAttempts,         color: '#F0A500' },
          { icon: Users,        label: 'Unique Users',   value: loading ? '—' : uniqueUsers,            color: '#60A5FA' },
          { icon: CheckCircle2, label: 'Total Passed',   value: loading ? '—' : totalPassed,            color: '#34D399' },
          { icon: TrendingUp,   label: 'Pass Rate',      value: loading ? '—' : `${overallPassRate}%`,  color: '#A78BFA' },
          { icon: Target,       label: 'Avg Score',      value: loading ? '—' : `${overallAvg}%`,       color: '#F472B6' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: '#1E293B' }}>
            <Icon size={14} style={{ color }} />
            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>{label}</span>
            <span className="text-sm font-bold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['overview', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={ tab === activeTab
              ? { background: '#2DD4BF', color: '#0F172A', border: '1px solid #2DD4BF' }
              : { background: 'transparent', color: '#94A3B8', border: '1px solid #334155' }}
            className={
              tab === activeTab
                ? 'px-4 py-1.5 text-sm rounded-full font-semibold capitalize'
                : 'px-4 py-1.5 text-sm rounded-full font-medium capitalize transition-colors'
            }
          >
            {tab === 'overview' ? 'Category Overview' : 'All Attempts'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-4" style={{ background: '#1E293B' }}>
              <div className="h-4 rounded animate-pulse mb-2 w-1/3" style={{ background: '#334155' }} />
              <div className="h-3 rounded animate-pulse w-1/2" style={{ background: '#334155' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16" style={{ color: '#94A3B8' }}>
          <p className="mb-4">{error}</p>
          <button onClick={load} className="text-sm flex items-center gap-1 mx-auto hover:underline" style={{ color: '#2DD4BF' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : activeTab === 'overview' ? (
        /* Category overview table */
        categoryStats.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#94A3B8' }}>
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No quiz attempts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryStats.map(stat => (
              <div key={stat.category} className="rounded-xl p-4" style={{ background: '#1E293B' }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-white">{stat.category}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                      {stat.totalAttempts} attempt{stat.totalAttempts !== 1 ? 's' : ''} · {stat.uniqueUsers} user{stat.uniqueUsers !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: stat.passRate >= 50 ? '#064E3B' : '#450A0A', color: stat.passRate >= 50 ? '#34D399' : '#F87171' }}>
                    {stat.passRate}% pass rate
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {[['Passed', stat.passCount, '#34D399'], ['Avg Score', `${stat.avgScore}%`, '#fff'], ['Best Score', `${stat.highestScore}%`, '#fff']].map(([label, val, color]) => (
                    <div key={String(label)} className="text-center p-2 rounded-lg" style={{ background: '#334155' }}>
                      <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color: color as string }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: '#334155' }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${stat.passRate}%`, background: stat.passRate >= 50 ? '#34D399' : '#EF4444' }} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* All attempts history */
        <div>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-4">
            {filterOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setFilterCategory(opt)}
                style={ opt === filterCategory
                  ? { background: '#2DD4BF', color: '#0F172A', border: '1px solid #2DD4BF' }
                  : { background: 'transparent', color: '#94A3B8', border: '1px solid #334155' }}
                className={
                  opt === filterCategory
                    ? 'px-3 py-1 text-xs rounded-full font-semibold'
                    : 'px-3 py-1 text-xs rounded-full font-medium transition-colors'
                }
              >
                {opt}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#94A3B8' }}>
              <p>No attempts for this category.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map(result => {
                const pct = Math.round((result.score / result.total) * 100)
                return (
                  <div key={result.id} className="rounded-xl p-3" style={{ background: '#1E293B' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white truncate">
                            {result.profiles?.full_name || 'Unknown User'}
                          </p>
                          {result.passed
                            ? <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                            : <XCircle size={14} className="text-red-400 flex-shrink-0" />
                          }
                        </div>
                        <p className="text-xs truncate" style={{ color: '#94A3B8' }}>{result.profiles?.email || result.user_id}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                          {result.category} · Attempt #{result.attempt_number} · {new Date(result.taken_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-base font-bold text-white">{pct}%</p>
                          <p className="text-xs" style={{ color: '#94A3B8' }}>{result.score}/{result.total}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: result.passed ? '#064E3B' : '#450A0A', color: result.passed ? '#34D399' : '#F87171' }}>
                          {result.passed ? 'Pass' : 'Fail'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
