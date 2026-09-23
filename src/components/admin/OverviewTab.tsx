'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminCard, AdminButton, adminInput, adminLabel } from '@/components/admin/ui'

type TrackRow = {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price_kobo: number
  features: string[] | null
  is_active: boolean
  syllabus: string | null
  objectives: string[] | null
}

function toLines(v: string[] | null | undefined) {
  return (v ?? []).join('\n')
}
function fromLines(v: string) {
  return v.split('\n').map(s => s.trim()).filter(Boolean)
}

export default function OverviewTab({ trackId }: { trackId: string }) {
  const [track, setTrack] = useState<TrackRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [features, setFeatures] = useState('')
  const [syllabus, setSyllabus] = useState('')
  const [objectives, setObjectives] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('schools')
        .select('id, slug, name, tagline, description, price_kobo, features, is_active, syllabus, objectives')
        .eq('id', trackId)
        .single()
      if (cancelled) return
      if (error || !data) {
        setMsg({ kind: 'err', text: 'Could not load this track.' })
        setLoading(false)
        return
      }
      const t = data as TrackRow
      setTrack(t)
      setName(t.name)
      setTagline(t.tagline ?? '')
      setDescription(t.description ?? '')
      setPrice(String(t.price_kobo / 100))
      setFeatures(toLines(t.features))
      setSyllabus(t.syllabus ?? '')
      setObjectives(toLines(t.objectives))
      setIsActive(t.is_active)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [trackId])

  async function save() {
    setMsg(null)
    if (!name.trim()) { setMsg({ kind: 'err', text: 'Track name is required.' }); return }
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setMsg({ kind: 'err', text: 'Enter a valid price in Naira.' }); return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('schools')
      .update({
        name: name.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        price_kobo: Math.round(priceNum * 100),
        features: fromLines(features),
        is_active: isActive,
        syllabus: syllabus.trim() || null,
        objectives: fromLines(objectives),
      })
      .eq('id', trackId)
    setSaving(false)
    setMsg(error
      ? { kind: 'err', text: 'Failed to save. Please try again.' }
      : { kind: 'ok', text: 'Saved.' })
  }

  if (loading) return <div className="h-40 rounded-xl bg-admin-surface animate-pulse" />
  if (!track) return <p className="text-sm text-red-400">{msg?.text ?? 'Track not found.'}</p>

  return (
    <div className="space-y-5">
      <AdminCard>
        <h2 className="text-white font-bold mb-4">Track details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={adminLabel}>Name</label>
            <input className={adminInput} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className={adminLabel}>Price (₦)</label>
            <input className={adminInput} type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={adminLabel}>URL</label>
            <p className="text-sm font-mono text-admin-muted">bearilly.com/{track.slug}</p>
          </div>
          <div className="sm:col-span-2">
            <label className={adminLabel}>Tagline</label>
            <input className={adminInput} value={tagline} onChange={e => setTagline(e.target.value)}
              placeholder="Short one-liner shown on the browse page" />
          </div>
          <div className="sm:col-span-2">
            <label className={adminLabel}>Description</label>
            <textarea className={adminInput} rows={2} value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={adminLabel}>Features (one per line)</label>
            <textarea className={adminInput} rows={3} value={features}
              onChange={e => setFeatures(e.target.value)} />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold text-white">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4" />
            Active (visible on the browse page)
          </label>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-white font-bold mb-1">Syllabus</h2>
        <p className="text-xs text-admin-muted mb-4">
          Shown to students as the course outline. This is deliverable 1.
        </p>
        <div className="space-y-4">
          <div>
            <label className={adminLabel}>Overview</label>
            <textarea className={adminInput} rows={6} value={syllabus}
              onChange={e => setSyllabus(e.target.value)}
              placeholder="What this track covers, who it is for, and how it is structured." />
          </div>
          <div>
            <label className={adminLabel}>Learning objectives (one per line)</label>
            <textarea className={adminInput} rows={5} value={objectives}
              onChange={e => setObjectives(e.target.value)}
              placeholder={'Explain the core ideas of each subject\nApply them to real situations'} />
          </div>
        </div>
      </AdminCard>

      <div className="flex items-center gap-3">
        <AdminButton onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</AdminButton>
        {msg && (
          <span className={msg.kind === 'ok' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>{msg.text}</span>
        )}
      </div>
    </div>
  )
}
