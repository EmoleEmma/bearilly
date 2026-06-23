'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Submission = {
  id: string
  submission_ref: string
  status: 'submitted' | 'under_review' | 'reviewed'
  link_url: string | null
  file_url: string | null
  submitted_at: string
  reviewer_notes: string | null
  user_id: string
  assessment_id: string
  profiles?: { full_name: string; email: string }
  assessments?: { title: string }
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles(full_name, email), assessments(title)')
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  async function updateStatus(sub: Submission, status: Submission['status']) {
    const supabase = createClient()
    await supabase
      .from('submissions')
      .update({ status, reviewer_notes: notes[sub.id] ?? sub.reviewer_notes })
      .eq('id', sub.id)
    setSubmissions(prev =>
      prev.map(s => (s.id === sub.id ? { ...s, status } : s))
    )
  }

  async function deleteSubmission(sub: Submission) {
    if (!confirm('Delete this submission permanently? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('submissions').delete().eq('id', sub.id)
    setSubmissions(prev => prev.filter(s => s.id !== sub.id))
  }

  const statusStyle = (status: string) => {
    if (status === 'reviewed')     return { background: '#064E3B', color: '#34D399' }
    if (status === 'under_review') return { background: '#1C2A1A', color: '#F0A500' }
    return { background: '#1E293B', color: '#94A3B8' }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Review and process student submissions.</p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#94A3B8' }}>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94A3B8' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-40" style={{ color: '#2DD4BF' }} />
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl p-5 relative" style={{ background: '#1E293B' }}>
              {/* Status badge top-right */}
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={statusStyle(sub.status)}>
                {sub.status.replace('_', ' ')}
              </span>

              <p className="font-bold text-white pr-28 mb-1">
                {sub.assessments?.title || 'Untitled Assessment'}
              </p>
              <p className="text-sm mb-0.5" style={{ color: '#94A3B8' }}>
                {sub.profiles?.full_name} — {sub.profiles?.email}
              </p>
              <p className="text-xs font-mono mb-0.5" style={{ color: '#64748B' }}>{sub.submission_ref}</p>
              <p className="text-xs mb-3" style={{ color: '#64748B' }}>{new Date(sub.submitted_at).toLocaleDateString()}</p>

              {sub.link_url && (
                <a href={sub.link_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline block mb-1" style={{ color: '#2DD4BF' }}>
                  View submission link →
                </a>
              )}
              {sub.file_url && (
                <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline block mb-3" style={{ color: '#2DD4BF' }}>
                  View uploaded file →
                </a>
              )}

              <textarea
                placeholder="Reviewer notes..."
                defaultValue={sub.reviewer_notes || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 mb-3 text-white placeholder:text-slate-500"
                style={{ background: '#334155', border: '1px solid #475569' }}
                rows={2}
              />

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => updateStatus(sub, 'under_review')}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors"
                  style={{ borderColor: '#94A3B8', color: '#94A3B8' }}>
                  Mark Under Review
                </button>
                <button onClick={() => updateStatus(sub, 'reviewed')}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors"
                  style={{ borderColor: '#2DD4BF', color: '#2DD4BF' }}>
                  Mark Reviewed
                </button>
                <button onClick={() => deleteSubmission(sub)}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium"
                  style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}