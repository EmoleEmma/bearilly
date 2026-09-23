'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminButton, AdminCard, EmptyState, adminInput, adminLabel } from '@/components/admin/ui'
import { KIND_LABEL, type Kind } from '@/lib/import/types'

type Subject = { id: string; name: string; order_index: number }
type Topic = { id: string; subject_id: string; title: string; order_index: number }

type SetRow = {
  id: string
  lesson_id: string | null
  type: Kind
  title: string
  question_count: number
  time_limit_sec: number | null
  pass_mark: number
}

const TOPIC_KINDS: Kind[] = ['knowledge_check', 'application_test', 'mastery_test']

export default function TestsTab({ trackId }: { trackId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [view, setView] = useState<'topics' | 'mock'>('topics')
  const [sets, setSets] = useState<SetRow[]>([])
  const [mockSet, setMockSet] = useState<SetRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const [subjRes, topicRes, mockRes] = await Promise.all([
      supabase.from('subjects').select('id, name, order_index').eq('school_id', trackId).order('order_index'),
      supabase.from('lessons').select('id, subject_id, title, order_index').eq('school_id', trackId).order('order_index'),
      supabase.from('question_sets').select('id, lesson_id, type, title, question_count, time_limit_sec, pass_mark')
        .eq('school_id', trackId).eq('type', 'mock_exam').maybeSingle(),
    ])
    if (subjRes.error) setError(`Could not load subjects: ${subjRes.error.message}`)
    else if (topicRes.error) setError(`Could not load topics: ${topicRes.error.message}`)
    setSubjects((subjRes.data || []) as Subject[])
    setTopics((topicRes.data || []) as Topic[])
    setMockSet((mockRes.data ?? null) as SetRow | null)
    setLoading(false)
  }, [trackId])

  useEffect(() => { load() }, [load])

  const loadTopicSets = useCallback(async (topicId: string) => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('question_sets')
      .select('id, lesson_id, type, title, question_count, time_limit_sec, pass_mark')
      .eq('lesson_id', topicId).in('type', TOPIC_KINDS)
    if (e) setError(`Could not load test settings: ${e.message}`)
    setSets((data || []) as SetRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (selectedTopicId) loadTopicSets(selectedTopicId)
  }, [selectedTopicId, loadTopicSets])

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? null
  const selectedTopic = topics.find(t => t.id === selectedTopicId) ?? null
  const topicsFor = (subjectId: string) => topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index)

  async function saveSet(set: SetRow | null, patch: { time_limit_sec: number | null; pass_mark: number }) {
    setSaving((set?.id) ?? 'new')
    setSaved(null)
    setError('')
    const supabase = createClient()
    if (set) {
      const { error: e } = await supabase.from('question_sets').update(patch).eq('id', set.id)
      if (e) { setError('Failed to save.'); setSaving(null); return }
    }
    setSaving(null)
    setSaved(set?.id ?? null)
    setTimeout(() => setSaved(null), 1500)
    if (view === 'mock') load()
    else if (selectedTopicId) loadTopicSets(selectedTopicId)
  }

  if (loading && subjects.length === 0) return <div className="h-40 rounded-xl bg-admin-surface animate-pulse" />

  // ── Mock exam settings ──────────────────────────────────
  if (view === 'mock') {
    return (
      <div>
        <button onClick={() => setView('topics')} className="text-sm text-admin-muted hover:text-white flex items-center gap-1 mb-4">
          <ChevronRight size={14} className="rotate-180" /> Back to topics
        </button>
        {error && <ErrorBanner message={error} />}
        {mockSet ? (
          <SettingRow set={mockSet} saving={saving === mockSet.id} saved={saved === mockSet.id} onSave={p => saveSet(mockSet, p)} />
        ) : (
          <EmptyState title="No Mock Exam yet" note="Add 100 Mock Exam questions in the Questions tab or the Import tab first — the test settings appear here once it exists." />
        )}
      </div>
    )
  }

  // ── One topic's test settings ───────────────────────────
  if (selectedTopic && selectedSubject) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
          <button onClick={() => setSelectedTopicId(null)} className="text-admin-muted hover:text-white">{selectedSubject.name}</button>
          <ChevronRight size={14} className="text-slate-500" />
          <span className="text-white font-semibold">{selectedTopic.title}</span>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="space-y-3">
          {TOPIC_KINDS.map(kind => {
            const set = sets.find(s => s.type === kind) ?? null
            return (
              <AdminCard key={kind} className="p-5!">
                <p className="text-white font-bold mb-3">{KIND_LABEL[kind]}</p>
                {set ? (
                  <SettingRow set={set} saving={saving === set.id} saved={saved === set.id} onSave={p => saveSet(set, p)} />
                ) : (
                  <p className="text-sm text-admin-muted">No {KIND_LABEL[kind]} questions yet for this topic. Add questions in the Questions tab first — settings appear here once it exists.</p>
                )}
              </AdminCard>
            )
          })}
        </div>
      </div>
    )
  }

  // ── One subject's topics ────────────────────────────────
  if (selectedSubject) {
    const list = topicsFor(selectedSubject.id)
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-4">
          <button onClick={() => setSelectedSubjectId(null)} className="text-admin-muted hover:text-white">Subjects</button>
          <ChevronRight size={14} className="text-slate-500" />
          <span className="text-white font-semibold">{selectedSubject.name}</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="No topics in this subject yet" note="Add topics in the Subjects & Topics tab first." />
        ) : (
          <div className="space-y-2">
            {list.map((t, i) => (
              <button key={t.id} onClick={() => setSelectedTopicId(t.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 bg-admin-surface border border-admin-border/40 hover:border-admin-accent/50 text-left">
                <p className="text-sm text-white truncate"><span className="text-admin-muted mr-2">{i + 1}.</span>{t.title}</p>
                <ChevronRight size={16} className="text-admin-muted shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Subject list ─────────────────────────────────────────
  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-admin-muted">Pick a subject to set time limits and pass marks for its topics.</p>
        <AdminButton variant="ghost" onClick={() => setView('mock')}>Mock Exam settings</AdminButton>
      </div>
      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" note="Add subjects in the Subjects & Topics tab first." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {subjects.map(s => (
            <button key={s.id} onClick={() => setSelectedSubjectId(s.id)} className="text-left">
              <AdminCard className="p-4! hover:border-admin-accent/50">
                <p className="text-white font-bold">{s.name}</p>
                <p className="text-xs text-admin-muted mt-0.5">{topicsFor(s.id).length} topics</p>
              </AdminCard>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return <div className="mb-4 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-400">{message}</div>
}

function SettingRow({ set, saving, saved, onSave }: {
  set: SetRow; saving: boolean; saved: boolean; onSave: (patch: { time_limit_sec: number | null; pass_mark: number }) => void
}) {
  const [minutes, setMinutes] = useState(set.time_limit_sec ? Math.round(set.time_limit_sec / 60) : 0)
  const [untimed, setUntimed] = useState(set.time_limit_sec === null)
  const [passMark, setPassMark] = useState(set.pass_mark)

  return (
    <div>
      <p className="text-xs text-admin-muted mb-3">{set.question_count} question{set.question_count === 1 ? '' : 's'}</p>
      <div className="grid sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className={adminLabel}>Time limit</label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} className={adminInput} disabled={untimed} value={untimed ? '' : minutes}
              onChange={e => setMinutes(Math.max(1, Number(e.target.value) || 1))} placeholder="minutes" />
            <label className="flex items-center gap-1.5 text-xs text-admin-muted whitespace-nowrap shrink-0">
              <input type="checkbox" checked={untimed} onChange={e => setUntimed(e.target.checked)} className="w-3.5 h-3.5" />
              Untimed
            </label>
          </div>
        </div>
        <div>
          <label className={adminLabel}>Pass mark (%)</label>
          <input type="number" min={0} max={100} className={adminInput} value={passMark}
            onChange={e => setPassMark(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        </div>
        <AdminButton onClick={() => onSave({ time_limit_sec: untimed ? null : minutes * 60, pass_mark: passMark })} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </AdminButton>
      </div>
    </div>
  )
}
