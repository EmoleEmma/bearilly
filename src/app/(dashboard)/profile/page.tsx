'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, BookOpen, Trophy, LogOut, KeyRound, TrendingUp, Target, BarChart2, ChevronRight } from 'lucide-react'

type Profile = {
  full_name: string
  email: string
  role: 'user' | 'admin'
  is_activated: boolean
  payment_status: 'unpaid' | 'paid' | 'activated'
  created_at: string
}

type QuizResult = {
  id: string
  category: string
  score: number
  total: number
  passed: boolean
  attempt_number: number
  taken_at: string
}

const TOTAL_CATEGORIES = 8
const TOTAL_LESSONS_PER_CATEGORY = 10
const TOTAL_LESSONS = TOTAL_CATEGORIES * TOTAL_LESSONS_PER_CATEGORY

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [completedLessons, setCompletedLessons] = useState(0)
  const [completedCategories, setCompletedCategories] = useState(0)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, role, is_activated, payment_status, created_at')
        .eq('id', user.id).single()

      if (profileError || !profileData) {
        setError('Failed to fetch user credentials record mapping rows.')
        setLoading(false)
        return
      }
      setProfile(profileData)

      const { data: lessons } = await supabase.from('lessons').select('id, category')
      const { data: progress } = await supabase
        .from('progress').select('lesson_id').eq('user_id', user.id).eq('status', 'completed')

      const completedIds = new Set((progress || []).map(p => p.lesson_id))
      setCompletedLessons(completedIds.size)

      const categories = Array.from(new Set((lessons || []).map(l => l.category)))
      const categoriesDone = categories.filter(cat => {
        const lessonsInCat = (lessons || []).filter(l => l.category === cat)
        return lessonsInCat.length > 0 && lessonsInCat.every(l => completedIds.has(l.id))
      })
      setCompletedCategories(categoriesDone.length)

      const quizRes = await fetch('/api/quiz/results')
      if (quizRes.ok) {
        const quizJson = await quizRes.json()
        setQuizResults(quizJson.results || [])
      }
    } catch (err) {
      console.error('Profile page error:', err)
      setError('System failure loading structural account indexes.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChange() {
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 6) { setPasswordError('Password length must register greater than 5 elements.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Verification string mismatched.'); return }
    setSavingPassword(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) { setPasswordError(updateError.message); setSavingPassword(false); return }
      setPasswordSuccess('Password encryption parameters recompiled safely.')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowPasswordForm(false), 1500)
    } catch {
      setPasswordError('Error mutating login database authorization keys.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 py-8 px-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-user-card border border-user-border/60 rounded-xl p-6 h-28 shadow-md animate-pulse" />
      ))}
    </div>
  )

  if (error || !profile) return (
    <div className="text-center py-16 text-user-muted text-sm font-medium">{error || 'We couldn\'t find your profile.'}</div>
  )

  const totalQuizzesTaken = quizResults.length
  const passedQuizzes = quizResults.filter(r => r.passed).length
  const scores = quizResults.map(r => Math.round((r.score / r.total) * 100))
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0
  const recentResults = quizResults.slice(0, 5)

  const initial = (profile.full_name || profile.email)[0].toUpperCase()
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const lessonProgressPct = Math.round((completedLessons / TOTAL_LESSONS) * 100)

  // 1. Structured Stats Array
  const statsMetrics = [
    { Icon: BookOpen, label: 'Lessons Complete', stat: `${completedLessons}/${TOTAL_LESSONS}` },
    { Icon: Trophy, label: 'Tracks Finished', stat: `${completedCategories}/${TOTAL_CATEGORIES}` },
    { Icon: ShieldCheck, label: 'Audits Passed', stat: `${passedQuizzes}/${totalQuizzesTaken}` },
  ]

  // 2. Structured Analysis Metrics Array
  const analysisMetrics = [
    { Icon: BarChart2, val: totalQuizzesTaken, label: 'Total Runs' },
    { Icon: TrendingUp, val: `${avgScore}%`, label: 'Average Yield' },
    { Icon: Target, val: `${highestScore}%`, label: 'Peak Metric' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-user-text tracking-tight mb-1.5">My Profile</h1>
        <p className="text-user-muted text-sm leading-relaxed">Manage your account, track progress, and view your achievements.</p>
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-7 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-20 h-20 rounded-full bg-user-accent flex items-center justify-center text-white text-3xl font-extrabold shadow-md flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-user-text text-xl leading-tight truncate tracking-tight">
              {profile.full_name || 'Anonymous Learner'}
            </h2>
            <p className="text-sm text-user-muted truncate mt-0.5">{profile.email}</p>
            <p className="text-xs text-user-muted/80 font-medium mt-1.5">Member since {memberSince}</p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2.5 flex-shrink-0">
          <span className={`text-xs font-semibold tracking-wide px-3 py-1 rounded-full border text-center self-start sm:self-end ${
            profile.is_activated ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#0D9488]' : 'bg-user-accent/10 border-user-accent/25 text-user-accent'
          }`}>
            {profile.is_activated ? 'Verified' : 'Pending Verification'}
          </span>
          <button className="rounded-full border-2 border-user-teal text-user-teal text-xs font-semibold px-4 py-1.5 hover:bg-user-teal hover:text-white transition-all duration-200">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {statsMetrics.map(({ Icon, label, stat }, i) => (
          <div key={i} className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-user-teal/10 flex items-center justify-center text-user-teal flex-shrink-0">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs text-user-muted font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-xl font-extrabold text-user-accent tracking-tight mt-0.5">{stat}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-user-text">Overall Learning Progress</p>
          <p className="text-base font-extrabold text-user-accent tracking-wide">{lessonProgressPct}%</p>
        </div>
        <div className="w-full bg-user-surface rounded-full h-2">
          <div
            className="bg-user-accent h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${lessonProgressPct}%` }}
          />
        </div>
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 mb-5">
        <div className="flex items-center justify-between border-b border-user-border pb-3 mb-4">
          <p className="text-sm font-semibold text-user-text">Quiz Performance</p>
          <Link href="/my-quizzes" className="text-xs text-user-teal font-semibold hover:underline flex items-center gap-0.5">
            View All <ChevronRight size={12} />
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-5">
          {analysisMetrics.map(({ Icon, val, label }, idx) => (
            <div key={idx} className="bg-user-surface rounded-xl p-3.5 text-center">
              <Icon size={16} className="text-user-teal mx-auto mb-1.5" />
              <p className="text-lg font-extrabold text-user-text tracking-tight">{val}</p>
              <p className="text-xs text-user-muted font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {recentResults.length === 0 ? (
          <p className="text-sm text-user-muted py-2">No quiz attempts yet.</p>
        ) : (
          <div className="divide-y divide-user-border">
            <p className="text-xs font-semibold text-user-muted uppercase tracking-wider pb-2">Recent Attempts</p>
            {recentResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-user-teal flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-user-text font-semibold text-sm truncate">{result.category}</p>
                    <p className="text-xs text-user-muted mt-0.5">
                      {new Date(result.taken_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      {' · '}Attempt #{result.attempt_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-user-text">{Math.round((result.score / result.total) * 100)}%</p>
                    <p className="text-xs text-user-muted">{result.score}/{result.total}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    result.passed ? 'bg-[#10B981]/10 text-[#0D9488]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}>
                    {result.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 mb-5">
        <p className="text-sm font-semibold text-user-text mb-3">Account Details</p>
        <div className="flex items-center justify-between py-3 border-b border-user-border text-sm">
          <span className="text-user-muted">Account Type</span>
          <span className="text-user-text font-semibold capitalize">{profile.role}</span>
        </div>
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-user-muted">Billing Status</span>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            profile.payment_status === 'unpaid' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#10B981]/10 text-[#0D9488]'
          }`}>
            {profile.payment_status}
          </span>
        </div>
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} className="text-user-teal" />
          <p className="text-sm font-semibold text-user-text">Password</p>
        </div>
        {!showPasswordForm ? (
          <button 
            onClick={() => setShowPasswordForm(true)}
            className="px-5 py-2 bg-user-surface border border-user-border rounded-full text-xs font-semibold text-user-text hover:bg-user-border/40 transition-all duration-200"
          >
            Change Password
          </button>
        ) : (
          <div className="space-y-3 animate-slideUp">
            <input type="password" placeholder="New password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-lg border border-user-border bg-user-surface focus:outline-none focus:ring-2 focus:ring-user-accent transition-all duration-200" />
            <input type="password" placeholder="Confirm new password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-lg border border-user-border bg-user-surface focus:outline-none focus:ring-2 focus:ring-user-accent transition-all duration-200" />
            
            {passwordError && (
              <p className="text-xs font-medium text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 px-4 py-2 rounded-lg">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs font-medium text-[#0D9488] bg-[#10B981]/10 border border-[#10B981]/20 px-4 py-2 rounded-lg">{passwordSuccess}</p>
            )}
            
            <div className="flex gap-2 pt-1">
              <button onClick={handlePasswordChange} disabled={savingPassword} className="px-5 py-2 bg-user-teal text-white rounded-full text-xs font-semibold shadow-sm hover:bg-user-accent transition-all duration-200">
                Save Password
              </button>
              <button onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordError('') }} className="px-5 py-2 bg-transparent border border-user-border text-user-muted rounded-full text-xs font-semibold hover:bg-user-surface transition-all duration-200">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-[#EF4444] hover:bg-[#EF4444]/5 transition-all duration-200"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}