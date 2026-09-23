'use client'

import { useRef, useState } from 'react'
import { Upload, Download, ClipboardPaste, AlertTriangle, CheckCircle2, Copy, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminButton, adminInput, adminLabel } from '@/components/admin/ui'
import type { Issue, ImportSummary, ImportPayload, ImportMode, Kind } from '@/lib/import/types'
import { KIND_LABEL } from '@/lib/import/types'
import { buildAiPrompt, type PasteWhat } from '@/lib/import/paste'

type PreviewResponse = { issues: Issue[]; errorCount: number; warningCount: number; payload: ImportPayload; summary: ImportSummary | null }

const PASTE_FIELDS: { key: PasteWhat; label: string }[] = [
  { key: 'lesson', label: 'Lesson' },
  { key: 'key_points', label: 'Key Points' },
  { key: 'resources', label: 'Resources' },
  { key: 'summary', label: 'Summary' },
  { key: 'revision', label: 'Revision notes' },
  { key: 'questions', label: 'Questions' },
]
const QUESTION_KINDS: { key: Kind; label: string }[] = [
  { key: 'practice', label: 'Practice (20)' },
  { key: 'knowledge_check', label: 'Knowledge Check' },
  { key: 'application_test', label: 'Application Test' },
  { key: 'mastery_test', label: 'Mastery Test' },
]

export default function ImportTab({ trackId, subjectNames }: { trackId: string; subjectNames: string[] }) {
  const [tab, setTab] = useState<'excel' | 'paste'>('excel')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Record<string, number> | null>(null)
  const [banner, setBanner] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // paste state
  const [pWhat, setPWhat] = useState<PasteWhat>('lesson')
  const [pSubject, setPSubject] = useState(subjectNames[0] ?? '')
  const [pTopic, setPTopic] = useState('')
  const [pKind, setPKind] = useState<Kind>('practice')
  const [pText, setPText] = useState('')
  const [pMode, setPMode] = useState<ImportMode>('append')
  const [promptCopied, setPromptCopied] = useState(false)

  async function authedFetch(url: string, init: RequestInit) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return fetch(url, {
      ...init,
      headers: { ...(init.headers || {}), ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    })
  }

  async function runExcelPreview(file: File) {
    setLoading(true); setBanner(''); setSaved(null)
    const form = new FormData()
    form.append('schoolId', trackId)
    form.append('file', file)
    const res = await authedFetch('/api/admin/import/preview', { method: 'POST', body: form })
    if (!res.ok) { setBanner('Could not check that file. Please try again.'); setLoading(false); return }
    setPreview(await res.json())
    setLoading(false)
  }

  async function runPastePreview() {
    if (!pSubject || !pTopic) { setBanner('Pick a subject and a topic first.'); return }
    if (!pText.trim()) { setBanner('Paste some content first.'); return }
    setLoading(true); setBanner(''); setSaved(null)
    const res = await authedFetch('/api/admin/import/preview', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId: trackId, what: pWhat, subject: pSubject, topic: pTopic, kind: pKind, text: pText, mode: pMode }),
    })
    if (!res.ok) { setBanner('Could not check that content. Please try again.'); setLoading(false); return }
    setPreview(await res.json())
    setLoading(false)
  }

  async function confirmSave() {
    if (!preview) return
    setSaving(true); setBanner('')
    const mode = tab === 'paste' ? pMode : 'replace'
    const res = await authedFetch('/api/admin/import/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId: trackId, payload: preview.payload, mode }),
    })
    const body = await res.json()
    setSaving(false)
    if (!res.ok) { setBanner(body.error || 'Saving failed. Nothing was changed.'); return }
    setSaved(body.result)
    setPreview(null)
    if (tab === 'paste') setPText('')
  }

  function copyPrompt() {
    const text = buildAiPrompt({ what: pWhat, subject: pSubject, topic: pTopic, kind: pKind })
    navigator.clipboard.writeText(text)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1">
        <button onClick={() => { setTab('excel'); setPreview(null); setBanner('') }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'excel' ? 'bg-admin-accent text-white' : 'text-admin-muted hover:bg-admin-card'}`}>
          <FileSpreadsheet size={15} /> Upload Excel file
        </button>
        <button onClick={() => { setTab('paste'); setPreview(null); setBanner('') }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'paste' ? 'bg-admin-accent text-white' : 'text-admin-muted hover:bg-admin-card'}`}>
          <ClipboardPaste size={15} /> Paste from AI
        </button>
      </div>

      {tab === 'excel' ? (
        <div className="rounded-xl p-5 bg-admin-surface border border-admin-border/40 space-y-4">
          <div className="flex flex-wrap gap-3">
            <a href="/api/admin/import/template" className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-muted hover:text-white">
              <Download size={14} /> Download blank template
            </a>
            <a href={`/api/admin/import/current-content?schoolId=${trackId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-muted hover:text-white">
              <Download size={14} /> Download this track's current content
            </a>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) runExcelPreview(f) }} />
            <AdminButton onClick={() => fileRef.current?.click()} disabled={loading}>
              <Upload size={15} /> {loading ? 'Checking…' : 'Choose file to upload'}
            </AdminButton>
            <p className="text-xs text-admin-muted mt-2">
              Uploading always checks the file first. Nothing is saved until you review it below and press Confirm.
              Re-uploading a corrected file updates the track's content instead of duplicating it — anything the file
              no longer includes for a topic's test is removed to match the file.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5 bg-admin-surface border border-admin-border/40 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={adminLabel}>What are you pasting?</label>
              <select className={adminInput} value={pWhat} onChange={e => setPWhat(e.target.value as PasteWhat)}>
                {PASTE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            {pWhat === 'questions' && (
              <div>
                <label className={adminLabel}>Which test</label>
                <select className={adminInput} value={pKind} onChange={e => setPKind(e.target.value as Kind)}>
                  {QUESTION_KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={adminLabel}>Subject</label>
              <select className={adminInput} value={pSubject} onChange={e => setPSubject(e.target.value)}>
                {subjectNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={adminLabel}>Topic</label>
              <input className={adminInput} value={pTopic} onChange={e => setPTopic(e.target.value)} placeholder="Must match an existing topic title" />
            </div>
            {pWhat === 'questions' && (
              <div>
                <label className={adminLabel}>If questions already exist here</label>
                <select className={adminInput} value={pMode} onChange={e => setPMode(e.target.value as ImportMode)}>
                  <option value="append">Add these as more questions</option>
                  <option value="replace">Replace what's there with these</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={adminLabel + ' mb-0'}>Give this prompt to your AI, then paste its reply below</label>
              <button onClick={copyPrompt} className="inline-flex items-center gap-1 text-xs font-semibold text-admin-accent hover:underline">
                <Copy size={12} /> {promptCopied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
            <textarea className={adminInput} rows={9} value={pText} onChange={e => setPText(e.target.value)}
              placeholder="Paste the AI's reply here…" />
          </div>

          <AdminButton onClick={runPastePreview} disabled={loading}>{loading ? 'Checking…' : 'Check this content'}</AdminButton>
        </div>
      )}

      {banner && <div className="rounded-lg px-4 py-3 text-sm bg-red-500/10 text-red-400">{banner}</div>}

      {saved && (
        <div className="rounded-xl p-5 bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-emerald-400 font-bold flex items-center gap-2 mb-2"><CheckCircle2 size={18} /> Saved</p>
          <ul className="text-sm text-emerald-200/90 space-y-0.5">
            {saved.subjects_created ? <li>{saved.subjects_created} subject(s) created</li> : null}
            {saved.subjects_updated ? <li>{saved.subjects_updated} subject(s) updated</li> : null}
            {saved.topics_created ? <li>{saved.topics_created} topic(s) created</li> : null}
            {saved.topics_updated ? <li>{saved.topics_updated} topic(s) updated</li> : null}
            {saved.content_saved ? <li>{saved.content_saved} content section(s) saved</li> : null}
            {saved.questions_created ? <li>{saved.questions_created} question(s) added</li> : null}
            {saved.questions_updated ? <li>{saved.questions_updated} question(s) updated</li> : null}
            {saved.questions_removed ? <li>{saved.questions_removed} question(s) removed (no longer in the file)</li> : null}
          </ul>
        </div>
      )}

      {preview && <PreviewPanel preview={preview} saving={saving} onConfirm={confirmSave} />}
    </div>
  )
}

function PreviewPanel({ preview, saving, onConfirm }: { preview: PreviewResponse; saving: boolean; onConfirm: () => void }) {
  const { issues, errorCount, warningCount, summary } = preview
  const canSave = errorCount === 0 && summary !== null

  return (
    <div className="rounded-xl p-5 bg-admin-surface border border-admin-border/40 space-y-4">
      <div className="flex items-center gap-2">
        {canSave
          ? <CheckCircle2 size={18} className="text-emerald-400" />
          : <AlertTriangle size={18} className="text-red-400" />}
        <p className="text-white font-bold">
          {canSave ? 'Looks good — nothing has been saved yet.' : `${errorCount} problem${errorCount === 1 ? '' : 's'} to fix before saving.`}
        </p>
      </div>

      {summary && (
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <SummaryBox label="Subjects" total={summary.subjects.total} detail={`${summary.subjects.new} new, ${summary.subjects.existing} updated`} />
          <SummaryBox label="Topics" total={summary.topics.total} detail={`${summary.topics.new} new, ${summary.topics.existing} updated`} />
          <SummaryBox label="Questions" total={summary.questions.total}
            detail={Object.entries(summary.questions.byKind).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${KIND_LABEL[k as Kind]}`).join(', ') || '—'} />
        </div>
      )}
      {summary && summary.questions.toRemove > 0 && (
        <p className="text-xs text-amber-400">{summary.questions.toRemove} previously saved question(s) will be removed because they are no longer in the file.</p>
      )}
      {summary && summary.legacyQuestionsUntouched > 0 && (
        <p className="text-xs text-admin-muted">{summary.legacyQuestionsUntouched} older question(s) outside the import system are not affected.</p>
      )}

      {issues.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-admin-border/40 divide-y divide-admin-border/30">
          {issues.map((it, i) => (
            <div key={i} className="px-3 py-2 text-sm flex gap-2">
              <span className={
                it.level === 'error' ? 'text-red-400 font-bold shrink-0' :
                it.level === 'warning' ? 'text-amber-400 font-bold shrink-0' : 'text-admin-muted font-bold shrink-0'
              }>{it.level === 'error' ? 'Error' : it.level === 'warning' ? 'Warning' : 'Note'}</span>
              <span className="text-admin-muted">
                {it.sheet}{it.row ? `, row ${it.row}` : ''}: <span className="text-white/90">{it.message}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <AdminButton onClick={onConfirm} disabled={!canSave || saving}>
        {saving ? 'Saving…' : 'Confirm and save'}
      </AdminButton>
    </div>
  )
}

function SummaryBox({ label, total, detail }: { label: string; total: number; detail: string }) {
  return (
    <div className="rounded-lg px-3 py-2 bg-admin-card">
      <p className="text-xs text-admin-muted uppercase tracking-wide">{label}</p>
      <p className="text-white font-bold">{total}</p>
      <p className="text-xs text-admin-muted">{detail}</p>
    </div>
  )
}
