'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Trophy, TrendingUp, Target, BarChart2, Calendar, RefreshCw } from 'lucide-react'

type QuizResult = {
  id: string
  category: string
  score: number
  total: number
  passed: boolean
  attempt_number: number
  taken_at: string
}

const categorySlugMap: Record<string, string> = {
  'Content Creation': 'content-creation',
  'Digital Marketing': 'digital-marketing',
  'Entrepreneurship': 'entrepreneurship',
  'Career Development': 'career-development',
  'Business Skills': 'business-skills',
  'Productivity': 'productivity',
  'Technology': 'technology',
  'Financial Literacy': 'financial-literacy',
}

const categoryAccentMap: Record<string, string> = {
  'Content Creation': '#F0A500',
  'Digital Marketing': '#38BDF8',
  'Entrepreneurship': '#34D399',
  'Career Development': '#A78BFA',
  'Business Skills': '#FB923C',
  'Productivity': '#F472B6',
  'Technology': '#60A5FA',
  'Financial Literacy': '#4ADE80',
}

export default function MyQuizzesPage() {
  const router = useRouter()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/quiz/results')
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) throw new Error('Failed to load quiz results')
      const json = await res.json()
      setResults(json.results || [])
    } catch (err) {
      console.error('My quizzes load error:', err)
      setError('Could not load your quiz history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Derived stats
  const totalAttempts = results.length
  const passedCount = results.filter(r => r.passed).length
  const scores = results.map(r => Math.round((r.score / r.total) * 100))
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0

  const filtered = filter === 'all' ? results
    : filter === 'passed' ? results.filter(r => r.passed)
    : results.filter(r => !r.passed)

  // Best result per category
  const bestByCategory: Record<string, QuizResult> = {}
  results.forEach(r => {
    const pct = (r.score / r.total) * 100
    const existing = bestByCategory[r.category]
    if (!existing || pct > (existing.score / existing.total) * 100) {
      bestByCategory[r.category] = r
    }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 animate-fadeIn">
      <PageHeader title="My Quizzes" subtitle="Track your quiz attempts, scores, and progress." />

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(
          [
            { icon: BarChart2, label: 'Total Attempts' },
            { icon: Trophy, label: 'Passed' },
            { icon: TrendingUp, label: 'Avg Score' },
            { icon: Target, label: 'Best Score' },
          ] as const
        ).map(({ icon: Icon, label }, idx) => {
          const value = idx === 0 ? totalAttempts : idx === 1 ? passedCount : idx === 2 ? `${avgScore}%` : `${highestScore}%`
          return (
            <Card key={label} padding="sm" className="text-center">
              <div className="w-9 h-9 rounded-full bg-user-teal/10 flex items-center justify-center text-user-teal mx-auto mb-2">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-extrabold text-user-accent tracking-tight">{loading ? '—' : value}</p>
              <p className="text-xs text-user-muted font-medium mt-0.5">{label}</p>
            </Card>
          )
        })}
      </div>

      {/* Pass rate bar */}
      {!loading && totalAttempts > 0 && (
        <Card className="mb-6 bg-user-surface">
          <div className="flex justify-between items-center mb-2.5">
            <p className="text-sm font-semibold text-user-text">Pass Rate</p>
            <p className="text-base font-extrabold text-user-accent">{passRate}%</p>
          </div>
          <div className="w-full bg-white rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 ease-in-out bg-user-accent"
              style={{ width: `${passRate}%` }}
            />
          </div>
          <p className="text-xs text-user-muted mt-2.5">{passedCount} passed out of {totalAttempts} attempts</p>
        </Card>
      )}

      {/* Best scores by category */}
      {!loading && Object.keys(bestByCategory).length > 0 && (
        <Card className="mb-6">
          <p className="text-sm font-semibold text-user-text mb-4">Best Score by Category</p>
          <div className="divide-y divide-user-border">
            {Object.entries(bestByCategory).map(([cat, result]) => {
              const pct = Math.round((result.score / result.total) * 100)
              return (
                <div key={cat} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-user-teal flex-shrink-0" />
                    <span className="text-sm text-user-text font-medium truncate">{cat}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 bg-user-surface rounded-full h-2">
                      <div className="h-2 rounded-full bg-user-accent transition-all duration-500 ease-in-out" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-user-text w-10 text-right">{pct}%</span>
                    <Badge variant={result.passed ? 'success' : 'danger'}>
                      {result.passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['all', 'passed', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              f === filter
                ? 'px-5 py-2 text-sm rounded-full bg-user-teal text-white font-semibold transition-all duration-200 capitalize'
                : 'px-5 py-2 text-sm rounded-full bg-user-card border border-user-border text-user-muted hover:border-user-teal hover:text-user-teal transition-all duration-200 capitalize'
            }
          >
            {f} {f === 'all' ? `(${totalAttempts})` : f === 'passed' ? `(${passedCount})` : `(${totalAttempts - passedCount})`}
          </button>
        ))}
      </div>

      {/* History list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <div className="h-4 bg-user-surface rounded animate-pulse mb-2 w-1/3" />
              <div className="h-3 bg-user-surface rounded animate-pulse w-1/2" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-user-muted">
          <p className="mb-4 text-sm">{error}</p>
          <button onClick={load} className="text-user-teal text-sm font-semibold hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-user-muted">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-user-accent/30" />
          <p className="mb-2 text-sm">{totalAttempts === 0 ? 'No quizzes taken yet.' : 'No results match this filter.'}</p>
          {totalAttempts === 0 && (
            <Link href="/learn" className="text-user-teal text-sm font-semibold hover:underline">
              Go to Learning Hub →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((result) => {
            const pct = Math.round((result.score / result.total) * 100)
            const slug = categorySlugMap[result.category]
            return (
              <Card key={result.id} className="animate-slideUp">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${result.passed ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      <p className="text-sm font-semibold text-user-text truncate">{result.category}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-user-muted mb-3.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(result.taken_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span>Attempt #{result.attempt_number}</span>
                    </div>
                    {/* Mini score bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-user-surface rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ease-in-out ${result.passed ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-user-text w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={result.passed ? 'success' : 'danger'}>
                      {result.passed ? 'Passed ✓' : 'Failed ✗'}
                    </Badge>
                    <span className="text-xl font-extrabold text-user-text">{result.score}<span className="text-xs font-normal text-user-muted">/{result.total}</span></span>
                    {slug && (
                      <Link
                        href={`/learn/${slug}/test`}
                        className="text-xs font-semibold text-user-teal hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Retake
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
