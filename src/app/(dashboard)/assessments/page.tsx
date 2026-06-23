'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Calendar, Inbox, ChevronRight } from 'lucide-react'

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
  category: string
}

type Submission = {
  assessment_id: string
  status: 'submitted' | 'under_review' | 'reviewed'
}

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Authorization layer unverified. Please re-authenticate your dashboard session.')
        setLoading(false)
        return
      }

      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('id, title, description, deadline, status, category')
        .order('category', { ascending: true })

      if (assessmentError) {
        console.error('Assessments load error:', assessmentError)
        setError('Could not establish synchronization with project matrices.')
        setLoading(false)
        return
      }

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('assessment_id, status')
        .eq('user_id', user.id)

      setAssessments(assessmentData || [])
      setSubmissions(submissionData || [])
    } catch (err) {
      console.error('Assessment Center load error:', err)
      setError('System exception occurring during assessment synchronization data pipes.')
    } finally {
      setLoading(false)
    }
  }

  function submissionFor(assessmentId: string) {
    return submissions.find(s => s.assessment_id === assessmentId)
  }

  function badgeFor(assessment: Assessment) {
    const submission = submissionFor(assessment.id)
    if (submission) {
      if (submission.status === 'reviewed') return <Badge variant="success">Completed</Badge>
      if (submission.status === 'under_review') return <Badge variant="info">In Audit</Badge>
      return <Badge variant="info">In Audit</Badge>
    }
    if (assessment.status === 'closed') return <Badge variant="danger">Closed</Badge>
    return <Badge variant="warning">Awaiting Action</Badge>
  }

  const categories = ['All', ...Array.from(new Set(assessments.map(a => a.category)))]
  const filtered = activeCategory === 'All' ? assessments : assessments.filter(a => a.category === activeCategory)
  const countFor = (cat: string) =>
    cat === 'All' ? assessments.length : assessments.filter(a => a.category === cat).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">Assessment Center</h1>
        <p className="text-slate-500 text-sm font-medium">Submit your work and track review status across all active assessments.</p>
      </div>

      {/* Category filter pills — teal active state */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => {
          const isActive = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all duration-200 ease-in-out border ${
                isActive
                  ? 'bg-[#4F7C82] border-[#4F7C82] text-white shadow-sm'
                  : 'bg-white border-[#E8E0D0] text-[#8B7355] hover:border-[#C89B5A] hover:bg-[#FAF7F2]'
              }`}
            >
              {cat} <span className={`ml-1 font-bold ${isActive ? 'text-white/70' : 'text-[#8B7355]/60'}`}>({countFor(cat)})</span>
            </button>
          )
        })}
      </div>

      {/* Structural Evaluation Ledger Grid Array */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-md animate-pulse">
              <div className="h-3.5 bg-[#E8E0D0] rounded w-1/4 mb-3" />
              <div className="h-3 bg-[#E8E0D0]/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
          <p className="text-sm font-semibold text-red-500 px-4">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md text-[#8B7355]">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40 text-[#C89B5A]" />
          <p className="text-xs font-semibold uppercase tracking-wider">No assessments found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((assessment) => (
            <Link key={assessment.id} href={`/assessments/${assessment.id}`} className="no-underline group">
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 ease-in-out flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#C89B5A] px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E7C997]/40 mb-2">
                    {assessment.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mb-1 group-hover:text-[#C89B5A] transition-colors tracking-tight">
                    {assessment.title}
                  </h3>
                  {assessment.description && (
                    <p className="text-sm text-[#8B7355] font-medium mb-3 line-clamp-2 max-w-2xl leading-relaxed">{assessment.description}</p>
                  )}
                  {assessment.deadline && (
                    <div className="flex items-center gap-1.5 text-[#8B7355] text-xs font-medium">
                      <Calendar size={12} className="text-[#8B7355]/60" /> TARGET LOCK: {new Date(assessment.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center flex-shrink-0 gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E8E0D0]">
                  {badgeFor(assessment)}
                  <div className="hidden sm:inline-flex items-center gap-0.5 text-xs font-semibold uppercase tracking-wider text-[#4F7C82] group-hover:text-[#C89B5A] transition-colors">
                    Access Portal <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}