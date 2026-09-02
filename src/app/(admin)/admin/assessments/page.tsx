'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Track = { id: string; name: string; slug: string }

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
  school_id: string | null
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [createTrackId, setCreateTrackId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const [{ data: assessmentData }, { data: trackData }] = await Promise.all([
      supabase.from('assessments').select('*').order('deadline', { ascending: true }),
      supabase.from('schools').select('id, name, slug').order('order_index'),
    ])
    setAssessments(assessmentData || [])
    setTracks((trackData || []) as Track[])
    if (trackData && trackData.length > 0 && !createTrackId) {
      setCreateTrackId(trackData[0].id)
    }
    setLoading(false)
  }

  async function handleCreate() {
    setError('')
    if (!title.trim()) return
    if (!createTrackId) { setError('Select a track for this assessment.'); return }
    setSaving(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('assessments').insert({
      title,
      description,
      deadline: deadline || null,
      status: 'active',
      school_id: createTrackId,
    })
    if (insertError) {
      setError('Failed to create assessment. Please try again.')
      setSaving(false)
      return
    }
    setTitle('')
    setDescription('')
    setDeadline('')
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function toggleStatus(assessment: Assessment) {
    const supabase = createClient()
    const newStatus = assessment.status === 'active' ? 'closed' : 'active'
    await supabase.from('assessments').update({ status: newStatus }).eq('id', assessment.id)
    setAssessments(prev =>
      prev.map(a => (a.id === assessment.id ? { ...a, status: newStatus } : a))
    )
  }

  async function deleteAssessment(assessment: Assessment) {
    if (!confirm(`Delete "${assessment.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('assessments').delete().eq('id', assessment.id)
    setAssessments(prev => prev.filter(a => a.id !== assessment.id))
  }

  function trackName(schoolId: string | null) {
    if (!schoolId) return 'No track'
    return tracks.find(t => t.id === schoolId)?.name || 'Unknown track'
  }

  const filteredAssessments = trackFilter === 'all'
    ? assessments
    : assessments.filter(a => a.school_id === trackFilter)
  const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 text-white placeholder:text-slate-500"
  const inputStyle = { background: '#334155', border: '1px solid #475569' }

  return (
    <div>
      <div className="flex items-start justify-between mb-7 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Assessments</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Create and manage assessments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-48">
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
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-bold rounded-lg"
              style={{ background: '#F0A500', color: '#0F172A' }}>
              + New Assessment
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: '#1E293B' }}>
          <p className="text-white font-semibold mb-3">New Assessment</p>
          {error && <p className="text-sm mb-2" style={{ color: '#F87171' }}>{error}</p>}
          <div className="relative mb-2">
            <select
              value={createTrackId}
              onChange={e => setCreateTrackId(e.target.value)}
              className={`${inputClass} appearance-none pr-8`}
              style={inputStyle}
            >
              {tracks.length === 0 && <option value="">No tracks available</option>}
              {tracks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
          </div>
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} mb-2`} style={inputStyle} />
          <textarea placeholder="Description / instructions" value={description} onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mb-2`} style={inputStyle} rows={3} />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className={`${inputClass} mb-4`} style={inputStyle} />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: '#2DD4BF', color: '#0F172A' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border"
              style={{ borderColor: '#475569', color: '#94A3B8' }}>
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
                {filteredAssessments.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center" style={{ color: '#94A3B8' }}>
                    <ClipboardList size={28} className="mx-auto mb-2 opacity-40" /><p>No assessments yet.</p>
                  </td></tr>
                ) : filteredAssessments.map((a, idx) => (
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
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: a.status === 'active' ? '#064E3B' : '#450A0A', color: a.status === 'active' ? '#34D399' : '#F87171' }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleStatus(a)}
                          className="px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors"
                          style={ a.status === 'active'
                            ? { borderColor: '#94A3B8', color: '#94A3B8' }
                            : { borderColor: '#2DD4BF', color: '#2DD4BF' }}>
                          {a.status === 'active' ? 'Close' : 'Reopen'}
                        </button>
                        <button onClick={() => deleteAssessment(a)}
                          className="px-3 py-1.5 text-sm rounded-lg border font-medium"
                          style={{ borderColor: '#EF4444', color: '#EF4444' }}>
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