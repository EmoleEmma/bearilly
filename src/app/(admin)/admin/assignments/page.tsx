'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, FileText, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminStatStrip from '@/components/dashboard/AdminStatStrip'

type Track = { id: string; name: string; slug: string }

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
  school_id: string | null
}

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

const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 text-white placeholder:text-slate-500"
const inputStyle = { background: '#334155', border: '1px solid #475569' }

/**
 * Assessments and Submissions merged into one page, since they were two
 * admin sidebar items managing two halves of the same workflow (an
 * assignment, and the work students turn in for it). One shared "track"
 * filter now covers both tabs instead of each having its own copy.
 * The two tabs' internal logic is unchanged from the pages they replace —
 * only the shell and the track-loading are shared.
 */
export default function AdminAssignmentsPage() {
  const [tab, setTab] = useState<'assessments' | 'submissions'>('assessments')
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [tracksLoading, setTracksLoading] = useState(true)

  useEffect(() => {
    async function loadTracks() {
      const supabase = createClient()
      const { data } = await supabase.from('schools').select('id, name, slug').order('order_index')
      setTracks((data || []) as Track[])
      setTracksLoading(false)
    }
    loadTracks()
  }, [])

  function trackName(schoolId: string | null | undefined) {
    if (!schoolId) return 'No track'
    return tracks.find(t => t.id === schoolId)?.name || 'Unknown track'
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Assignments</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Manage assessments and review student submissions.</p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          <button onClick={() => setTab('assessments')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={tab === 'assessments' ? { background: '#4F7C82', color: '#fff' } : { color: '#94A3B8' }}>
            <ClipboardList size={15} /> Assessments
          </button>
          <button onClick={() => setTab('submissions')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={tab === 'submissions' ? { background: '#4F7C82', color: '#fff' } : { color: '#94A3B8' }}>
            <FileText size={15} /> Submissions
          </button>
        </div>
        <div className="relative w-full sm:w-48">
          <select
            value={trackFilter}
            onChange={e => setTrackFilter(e.target.value)}
            disabled={tracksLoading}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm rounded-lg focus:outline-none focus:ring-1"
            style={{ background: '#334155', border: '1px solid #475569', color: '#fff' }}
          >
            <option value="all">All tracks</option>
            {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
        </div>
      </div>

      {tab === 'assessments'
        ? <AssessmentsPanel tracks={tracks} trackFilter={trackFilter} trackName={trackName} />
        : <SubmissionsPanel tracks={tracks} trackFilter={trackFilter} trackName={trackName} />}
    </div>
  )
}

function AssessmentsPanel({ tracks, trackFilter, trackName }: {
  tracks: Track[]; trackFilter: string; trackName: (id: string | null | undefined) => string
}) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [createTrackId, setCreateTrackId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (tracks.length > 0 && !createTrackId) setCreateTrackId(tracks[0].id)
  }, [tracks, createTrackId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('assessments').select('*').order('deadline', { ascending: true })
    setAssessments(data || [])
    setLoading(false)
  }

  async function handleCreate() {
    setError('')
    if (!title.trim()) return
    if (!createTrackId) { setError('Select a track for this assessment.'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('assessments').insert({
      title, description, deadline: deadline || null, status: 'active', school_id: createTrackId,
    })
    if (insertError) { setError('Failed to create assessment. Please try again.'); setSaving(false); return }
    setTitle(''); setDescription(''); setDeadline(''); setShowForm(false); setSaving(false)
    await load()
  }

  async function toggleStatus(assessment: Assessment) {
    const supabase = createClient()
    const newStatus = assessment.status === 'active' ? 'closed' : 'active'
    await supabase.from('assessments').update({ status: newStatus }).eq('id', assessment.id)
    setAssessments(prev => prev.map(a => (a.id === assessment.id ? { ...a, status: newStatus } : a)))
  }

  async function deleteAssessment(assessment: Assessment) {
    if (!confirm(`Delete "${assessment.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('assessments').delete().eq('id', assessment.id)
    setAssessments(prev => prev.filter(a => a.id !== assessment.id))
  }

  const filtered = trackFilter === 'all' ? assessments : assessments.filter(a => a.school_id === trackFilter)

  return (
    <div>
      <div className="flex justify-end mb-4">
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-bold rounded-lg" style={{ background: '#F0A500', color: '#0F172A' }}>
            + New Assessment
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: '#1E293B' }}>
          <p className="text-white font-semibold mb-3">New Assessment</p>
          {error && <p className="text-sm mb-2" style={{ color: '#F87171' }}>{error}</p>}
          <div className="relative mb-2">
            <select value={createTrackId} onChange={e => setCreateTrackId(e.target.value)}
              className={`${inputClass} appearance-none pr-8`} style={inputStyle}>
              {tracks.length === 0 && <option value="">No tracks available</option>}
              {tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
          </div>
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
            className={`${inputClass} mb-2`} style={inputStyle} />
          <textarea placeholder="Description / instructions" value={description} onChange={e => setDescription(e.target.value)}
            className={`${inputClass} mb-2`} style={inputStyle} rows={3} />
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className={`${inputClass} mb-4`} style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: '#2DD4BF', color: '#0F172A' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border" style={{ borderColor: '#475569', color: '#94A3B8' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: '#94A3B8' }}>Loading assessments...</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', background: '#0F172A' }}>
                  {['Title', 'Track', 'Deadline', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#2DD4BF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center" style={{ color: '#94A3B8' }}>
                    <ClipboardList size={28} className="mx-auto mb-2 opacity-40" /><p>No assessments yet.</p>
                  </td></tr>
                ) : filtered.map((a, idx) => (
                  <tr key={a.id} style={{ background: idx % 2 === 0 ? 'transparent' : '#0F172A22', borderBottom: '1px solid #33415540' }}>
                    <td className="px-5 py-3 font-semibold text-white">{a.title}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#1E3A5F', color: '#7DD3FC' }}>
                        {trackName(a.school_id)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#94A3B8' }}>
                      {a.deadline ? new Date(a.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: a.status === 'active' ? '#064E3B' : '#450A0A', color: a.status === 'active' ? '#34D399' : '#F87171' }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleStatus(a)}
                          className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors"
                          style={a.status === 'active' ? { borderColor: '#94A3B8', color: '#94A3B8' } : { borderColor: '#2DD4BF', color: '#2DD4BF' }}>
                          {a.status === 'active' ? 'Close' : 'Reopen'}
                        </button>
                        <button onClick={() => deleteAssessment(a)}
                          className="px-3 py-1.5 text-sm rounded-lg border font-medium" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SubmissionsPanel({ trackFilter, trackName }: {
  tracks: Track[]; trackFilter: string; trackName: (id: string | null | undefined) => string
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('submissions')
      .select('*, profiles(full_name, email), assessments(title, school_id)')
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  async function updateStatus(sub: Submission, status: Submission['status']) {
    const supabase = createClient()
    await supabase.from('submissions').update({ status, reviewer_notes: notes[sub.id] ?? sub.reviewer_notes }).eq('id', sub.id)
    setSubmissions(prev => prev.map(s => (s.id === sub.id ? { ...s, status } : s)))
  }

  async function deleteSubmission(sub: Submission) {
    if (!confirm('Delete this submission permanently? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('submissions').delete().eq('id', sub.id)
    setSubmissions(prev => prev.filter(s => s.id !== sub.id))
  }

  const filtered = trackFilter === 'all' ? submissions : submissions.filter(s => s.assessments?.school_id === trackFilter)

  const statusStyle = (status: string) => {
    if (status === 'reviewed') return { background: '#064E3B', color: '#34D399' }
    if (status === 'under_review') return { background: '#1C2A1A', color: '#F0A500' }
    return { background: '#1E293B', color: '#94A3B8' }
  }

  return (
    <div>
      <AdminStatStrip stats={[
        { label: 'Pending Review', value: submissions.filter(s => s.status === 'submitted').length },
        { label: 'Total Submissions', value: submissions.length },
      ]} />

      {loading ? (
        <p className="text-sm" style={{ color: '#94A3B8' }}>Loading submissions...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94A3B8' }}>
          <FileText size={32} className="mx-auto mb-3 opacity-40" style={{ color: '#2DD4BF' }} />
          <p>No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sub => (
            <div key={sub.id} className="rounded-xl p-5 relative" style={{ background: '#1E293B' }}>
              <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize" style={statusStyle(sub.status)}>
                {sub.status.replace('_', ' ')}
              </span>
              <p className="font-bold text-white pr-28 mb-1">{sub.assessments?.title || 'Untitled Assessment'}</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold mb-1.5" style={{ background: '#1E3A5F', color: '#7DD3FC' }}>
                {trackName(sub.assessments?.school_id)}
              </span>
              <p className="text-sm mb-0.5" style={{ color: '#94A3B8' }}>{sub.profiles?.full_name} — {sub.profiles?.email}</p>
              <p className="text-xs font-mono mb-0.5" style={{ color: '#64748B' }}>{sub.submission_ref}</p>
              <p className="text-xs mb-3" style={{ color: '#64748B' }}>{new Date(sub.submitted_at).toLocaleDateString()}</p>

              {sub.link_url && (
                <a href={sub.link_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline block mb-1" style={{ color: '#2DD4BF' }}>
                  View submission link →
                </a>
              )}
              {sub.file_url && (
                <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline block mb-3" style={{ color: '#2DD4BF' }}>
                  View uploaded file →
                </a>
              )}

              <textarea
                placeholder="Reviewer notes..."
                defaultValue={sub.reviewer_notes || ''}
                onChange={e => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 mb-3 text-white placeholder:text-slate-500"
                style={{ background: '#334155', border: '1px solid #475569' }}
                rows={2}
              />

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => updateStatus(sub, 'under_review')}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors" style={{ borderColor: '#94A3B8', color: '#94A3B8' }}>
                  Mark Under Review
                </button>
                <button onClick={() => updateStatus(sub, 'reviewed')}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors" style={{ borderColor: '#2DD4BF', color: '#2DD4BF' }}>
                  Mark Reviewed
                </button>
                <button onClick={() => deleteSubmission(sub)}
                  className="px-3 py-1.5 text-sm rounded-lg border font-medium" style={{ borderColor: '#EF4444', color: '#EF4444' }}>
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
