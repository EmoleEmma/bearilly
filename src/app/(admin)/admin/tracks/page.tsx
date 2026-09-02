'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, X, Pencil, Layers, FilePlus2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminStatStrip from '@/components/dashboard/AdminStatStrip'

type Track = {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price_kobo: number
  features: string[]
  is_active: boolean
  order_index: number
}

type FormState = {
  id: string | null
  slug: string
  name: string
  tagline: string
  description: string
  price: string
  features: string
  is_active: boolean
}

const emptyForm: FormState = {
  id: null,
  slug: '',
  name: '',
  tagline: '',
  description: '',
  price: '',
  features: '',
  is_active: true,
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('schools')
      .select('id, slug, name, tagline, description, price_kobo, features, is_active, order_index')
      .order('order_index')
    setTracks((data || []) as Track[])
    setLoading(false)
  }

  function openNewForm() {
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEditForm(track: Track) {
    setForm({
      id: track.id,
      slug: track.slug,
      name: track.name,
      tagline: track.tagline || '',
      description: track.description || '',
      price: String(track.price_kobo / 100),
      features: (track.features || []).join('\n'),
      is_active: track.is_active,
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyForm)
    setError('')
  }

  async function handleSave() {
    setError('')

    if (!form.name.trim()) { setError('Track name is required.'); return }
    const slug = slugify(form.slug || form.name)
    if (!slug) { setError('A valid URL slug is required.'); return }
    const priceNum = Number(form.price)
    if (!form.price || isNaN(priceNum) || priceNum <= 0) { setError('Enter a valid price in Naira.'); return }

    const featuresArray = form.features
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean)

    const payload = {
      slug,
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      price_kobo: Math.round(priceNum * 100),
      features: featuresArray,
      is_active: form.is_active,
    }

    setSaving(true)
    const supabase = createClient()

    if (form.id) {
      const { error: updateError } = await supabase
        .from('schools')
        .update(payload)
        .eq('id', form.id)
      if (updateError) {
        setError(updateError.message.includes('duplicate') ? 'That URL slug is already in use.' : 'Failed to save. Please try again.')
        setSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase
        .from('schools')
        .insert({ ...payload, order_index: tracks.length })
      if (insertError) {
        setError(insertError.message.includes('duplicate') ? 'That URL slug is already in use.' : 'Failed to save. Please try again.')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    closeForm()
    load()
  }

  async function toggleActive(track: Track) {
    const supabase = createClient()
    await supabase
      .from('schools')
      .update({ is_active: !track.is_active })
      .eq('id', track.id)
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_active: !t.is_active } : t))
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-deep flex items-center gap-2">
            <Layers size={22} /> Tracks
          </h1>
          <p className="text-sm text-admin-slate/60 mt-1">
            Add a new track — it goes live at bearilly.com/&lt;slug&gt; immediately, no code required.
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shrink-0"
          style={{ backgroundColor: '#4F7C82' }}
        >
          <Plus size={16} /> New Track
        </button>
      </div>

      <AdminStatStrip stats={[
        { label: 'Total Tracks', value: tracks.length },
        { label: 'Active', value: tracks.filter(t => t.is_active).length },
      ]} />

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && tracks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          No tracks yet. Click "New Track" to add the first one.
        </div>
      )}

      <div className="space-y-3">
        {tracks.map(track => (
          <div key={track.id} className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-admin-deep truncate">{track.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${track.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {track.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-admin-slate/50 font-mono mt-0.5 truncate">bearilly.com/{track.slug}</p>
              {track.tagline && <p className="text-sm text-admin-slate/70 mt-1">{track.tagline}</p>}
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1 shrink-0">
              <p className="font-bold text-admin-teal">{formatNaira(track.price_kobo)}</p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/content?track=${track.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <FilePlus2 size={13} /> Content
                </Link>
                <button
                  onClick={() => toggleActive(track)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {track.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEditForm(track)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
                  aria-label="Edit track"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-admin-deep">
                {form.id ? 'Edit Track' : 'New Track'}
              </h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Track Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value
                    setForm(f => ({ ...f, name, slug: f.id ? f.slug : slugify(name) }))
                  }}
                  placeholder="e.g. Chemistry"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  URL Slug
                </label>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-admin-slate/40 font-mono shrink-0">bearilly.com/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="chemistry"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="Short one-liner shown on the browse page"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Longer copy shown on the payment page"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Price (₦)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="1000"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Features (one per line)
                </label>
                <textarea
                  value={form.features}
                  onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                  placeholder={'Full access to all lessons\nUnlimited AI Tutor conversations\nGraded assessments'}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-admin-deep">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                Active (visible on the browse page immediately)
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-admin-slate/70 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#4F7C82' }}
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Track'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}