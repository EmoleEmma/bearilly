'use client'

import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('assessments')
      .select('*')
      .order('deadline', { ascending: true })
    setAssessments(data || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('assessments').insert({
      title,
      description,
      deadline: deadline || null,
      status: 'active',
    })
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

  const inputClass = "w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 text-white placeholder:text-slate-500"
  const inputStyle = { background: '#334155', border: '1px solid #475569' }

  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Assessments</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Create and manage assessments.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-bold rounded-lg"
            style={{ background: '#F0A500', color: '#0F172A' }}>
            + New Assessment
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl p-5 mb-5" style={{ background: '#1E293B' }}>
          <p className="text-white font-semibold mb-3">New Assessment</p>
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
                  {['Title', 'Deadline', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#2DD4BF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center" style={{ color: '#94A3B8' }}>
                    <ClipboardList size={28} className="mx-auto mb-2 opacity-40" /><p>No assessments yet.</p>
                  </td></tr>
                ) : assessments.map((a, idx) => (
                  <tr key={a.id} style={{ background: idx % 2 === 0 ? 'transparent' : '#0F172A22', borderBottom: '1px solid #33415540' }}>
                    <td className="px-5 py-3 font-semibold text-white">{a.title}</td>
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