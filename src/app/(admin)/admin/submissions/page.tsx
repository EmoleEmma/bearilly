'use client'

import { useEffect, useState } from 'react'
import { FileText, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminStatStrip from '@/components/dashboard/AdminStatStrip'

type Track = { id: string; name: string; slug: string }

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
  assessments?: { title: string; school_id: string | null }
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  
  useEffect(() => { load() }, [])
  
  async function load() {
    setLoading(true)
    const supabase = createClient()
    const [{ data: subData }, { data: trackData }] = await Promise.all([
      supabase
        .from('submissions')
        .select('*, profiles(full_name, email), assessments(title, school_id)')
        .order('submitted_at', { ascending: false }),
      supabase.from('schools').select('id, name, slug').order('order_index'),
    ])
    setSubmissions(subData || [])
    setTracks((trackData || []) as Track[])
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

  function trackName(schoolId: string | null | undefined) {
    if (!schoolId) return 'No track'
    return tracks.find(t => t.id === schoolId)?.name || 'Unknown track'
  }

  const filteredSubmissions = trackFilter === 'all'
    ? submissions
    : submissions.filter(s => s.assessments?.school_id === trackFilter)

  const statusStyle = (status: string) => {
    if (status === 'reviewed')     return { background: '#064E3B', color: '#34D399' }
    if (status === 'under_review') return { background: '#1C2A1A', color: '#F0A500' }
    return { background: '#1E293B', color: '#94A3B8' }
  }

  return (
    <div>
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Review and process student submissions.</p>
        </div>
        <div className="relative w-full sm:w-48">
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-lg focus:outline-none focus:ring-1"
            style={{ background: '#334155', border: '1px solid #475569', color: '#fff' }}
          >
            <option value="all">All tracks</option>
            {tracks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      <AdminStatStrip stats={[
        { label: 'Pending Review', value: submissions.filter(s => s.status === 'submitted').length },
        { label: 'Total Submissions', value: submissions.length },
      ]} />
      
      {loading ? (
        <p className="text-sm" style={{ color: '#94A3B8' }}>Loading submissions...</p>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94A3B8' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-40" style={{ color: '#2DD4BF' }} />
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <div key={sub.id} className="rounded-xl p-5 relative" style={{ background: '#1E293B' }}>
              {/* Status badge top-right */}
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={statusStyle(sub.status)}>
                {sub.status.replace('_', ' ')}
              </span>

              <p className="font-bold text-white pr-28 mb-1">
                {sub.assessments?.title || 'Untitled Assessment'}
              </p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold mb-1.5" style={{ background: '#1E3A5F', color: '#7DD3FC' }}>
                {trackName(sub.assessments?.school_id)}
              </span>
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