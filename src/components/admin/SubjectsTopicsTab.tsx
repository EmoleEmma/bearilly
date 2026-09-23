'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminCard, AdminButton, EmptyState, adminInput, adminLabel } from '@/components/admin/ui'

type Subject = {
  id: string
  slug: string
  name: string
  description: string | null
  order_index: number
}

type Topic = {
  id: string
  subject_id: string | null
  category: string
  title: string
  description: string | null
  content: string | null
  example: string | null
  order_index: number
}

type ContentType = 'titbits' | 'summary' | 'revision' | 'resources'
type TopicContentMap = Record<ContentType, string>
const emptyContent: TopicContentMap = { titbits: '', summary: '', revision: '', resources: '' }

type TopicForm = {
  id: string | null
  title: string
  description: string
  content: string
  example: string
  extra: TopicContentMap
}
const emptyTopicForm: TopicForm = {
  id: null, title: '', description: '', content: '', example: '', extra: { ...emptyContent },
}

type SubjectForm = { id: string | null; name: string; description: string }
const emptySubjectForm: SubjectForm = { id: null, name: '', description: '' }

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function SubjectsTopicsTab({ trackId }: { trackId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [subjectForm, setSubjectForm] = useState<SubjectForm | null>(null)
  const [topicForm, setTopicForm] = useState<TopicForm | null>(null)
  const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const [subjectRes, topicRes] = await Promise.all([
      supabase.from('subjects')
        .select('id, slug, name, description, order_index')
        .eq('school_id', trackId).order('order_index'),
      supabase.from('lessons')
        .select('id, subject_id, category, title, description, content, example, order_index')
        .eq('school_id', trackId).order('order_index'),
    ])
    if (subjectRes.error) setError(`Could not load subjects: ${subjectRes.error.message}`)
    else if (topicRes.error) setError(`Could not load topics: ${topicRes.error.message}`)
    setSubjects((subjectRes.data || []) as Subject[])
    setTopics((topicRes.data || []) as Topic[])
    setLoading(false)
  }, [trackId])
  useEffect(() => { load() }, [load])

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? null
  const topicsFor = (subjectId: string) =>
    topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index)

  // ── Subjects ────────────────────────────────────────────
  async function saveSubject() {
    if (!subjectForm) return
    setError('')
    const name = subjectForm.name.trim()
    if (!name) { setError('Subject name is required.'); return }
    const slug = slugify(name)
    if (!slug) { setError('Subject name needs letters or numbers.'); return }
    setSaving(true)
    const supabase = createClient()

    if (subjectForm.id) {
      const previous = subjects.find(s => s.id === subjectForm.id)
      const { error: e } = await supabase.from('subjects')
        .update({ name, description: subjectForm.description.trim() || null })
        .eq('id', subjectForm.id)
      if (e) { setError('Failed to save subject.'); setSaving(false); return }
      // Keep the legacy text column on its topics in step with the new name,
      // because student pages still read lessons.category until they are migrated.
      if (previous && previous.name !== name) {
        await supabase.from('lessons').update({ category: name }).eq('subject_id', subjectForm.id)
      }
    } else {
      const { error: e } = await supabase.from('subjects').insert({
        school_id: trackId, slug, name,
        description: subjectForm.description.trim() || null,
        order_index: subjects.length,
      })
      if (e) {
        setError(e.message.includes('duplicate') ? 'A subject with that name already exists.' : 'Failed to save subject.')
        setSaving(false); return
      }
    }
    setSaving(false)
    setSubjectForm(null)
    load()
  }

  async function deleteSubject(subject: Subject) {
    const count = topicsFor(subject.id).length
    if (count > 0) {
      alert(`"${subject.name}" still has ${count} topic${count === 1 ? '' : 's'}. Delete or move its topics first.`)
      return
    }
    if (!confirm(`Delete subject "${subject.name}"?`)) return
    const supabase = createClient()
    await supabase.from('subjects').delete().eq('id', subject.id)
    if (selectedSubjectId === subject.id) setSelectedSubjectId(null)
    load()
  }

  // ── Topics ──────────────────────────────────────────────
  async function openTopicForm(topic?: Topic) {
    setError('')
    if (!topic) { setTopicForm({ ...emptyTopicForm, extra: { ...emptyContent } }); return }
    const supabase = createClient()
    const { data } = await supabase.from('topic_content').select('type, body').eq('lesson_id', topic.id)
    const extra: TopicContentMap = { ...emptyContent }
    for (const row of data || []) extra[row.type as ContentType] = row.body ?? ''
    setTopicForm({
      id: topic.id,
      title: topic.title,
      description: topic.description ?? '',
      content: topic.content ?? '',
      example: topic.example ?? '',
      extra,
    })
  }

  async function saveTopic() {
    if (!topicForm || !selectedSubject) return
    setError('')
    if (!topicForm.title.trim()) { setError('Topic title is required.'); return }
    if (!topicForm.content.trim()) { setError('Lesson content is required.'); return }
    setSaving(true)
    const supabase = createClient()

    const base = {
      school_id: trackId,
      subject_id: selectedSubject.id,
      category: selectedSubject.name, // legacy column, kept in step
      title: topicForm.title.trim(),
      description: topicForm.description.trim() || null,
      content: topicForm.content.trim(),
      example: topicForm.example.trim() || null,
    }

    let lessonId = topicForm.id
    if (lessonId) {
      const { error: e } = await supabase.from('lessons').update(base).eq('id', lessonId)
      if (e) { setError('Failed to save topic.'); setSaving(false); return }
    } else {
      const { data, error: e } = await supabase.from('lessons')
        .insert({
          ...base,
          order_index: topicsFor(selectedSubject.id).length,
          source_key: `${selectedSubject.slug}/${slugify(base.title)}`,
        })
        .select('id').single()
      if (e || !data) {
        setError(e?.message.includes('duplicate') ? 'A topic with that title already exists in this subject.' : 'Failed to save topic.')
        setSaving(false); return
      }
      lessonId = data.id as string
    }

    // topic_content: upsert non-empty rows, remove emptied ones
    for (const type of Object.keys(topicForm.extra) as ContentType[]) {
      const body = topicForm.extra[type].trim()
      if (body) {
        await supabase.from('topic_content').upsert(
          { lesson_id: lessonId, type, body, updated_at: new Date().toISOString() },
          { onConflict: 'lesson_id,type' }
        )
      } else if (topicForm.id) {
        await supabase.from('topic_content').delete().eq('lesson_id', lessonId).eq('type', type)
      }
    }

    setSaving(false)
    setTopicForm(null)
    load()
  }

  async function deleteTopic(topic: Topic) {
    if (!confirm(`Delete "${topic.title}"? This also deletes its questions and student progress for it.`)) return
    const supabase = createClient()
    await supabase.from('lessons').delete().eq('id', topic.id)
    load()
  }

  if (loading) return <div className="h-40 rounded-xl bg-admin-surface animate-pulse" />

  // ── Topic list for one subject ──────────────────────────
  if (selectedSubject) {
    const list = topicsFor(selectedSubject.id)
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setSelectedSubjectId(null)} className="text-admin-muted hover:text-white">Subjects</button>
            <ChevronRight size={14} className="text-slate-500" />
            <span className="text-white font-semibold">{selectedSubject.name}</span>
            <span className="text-admin-muted">· {list.length} topic{list.length === 1 ? '' : 's'}</span>
          </div>
          <AdminButton onClick={() => openTopicForm()}><Plus size={15} /> New topic</AdminButton>
        </div>

        {list.length === 0 ? (
          <EmptyState title="No topics in this subject yet" note='Click "New topic" to add the first one.' />
        ) : (
          <div className="space-y-2">
            {list.map((t, i) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 bg-admin-surface border border-admin-border/40">
                <p className="text-sm text-white truncate"><span className="text-admin-muted mr-2">{i + 1}.</span>{t.title}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openTopicForm(t)} className="p-1.5 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card" aria-label="Edit topic"><Pencil size={14} /></button>
                  <button onClick={() => deleteTopic(t)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" aria-label="Delete topic"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {topicForm && (
          <Modal title={topicForm.id ? 'Edit topic' : 'New topic'} onClose={() => setTopicForm(null)} wide>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className={adminLabel}>Title</label>
                <input className={adminInput} value={topicForm.title}
                  onChange={e => setTopicForm(f => f && ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className={adminLabel}>Short description</label>
                <input className={adminInput} value={topicForm.description}
                  onChange={e => setTopicForm(f => f && ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className={adminLabel}>Lesson content</label>
                <textarea className={adminInput} rows={9} value={topicForm.content}
                  onChange={e => setTopicForm(f => f && ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <label className={adminLabel}>Example (optional)</label>
                <textarea className={adminInput} rows={3} value={topicForm.example}
                  onChange={e => setTopicForm(f => f && ({ ...f, example: e.target.value }))} />
              </div>
              <div>
                <label className={adminLabel}>Key points (one per line)</label>
                <textarea className={adminInput} rows={4} value={topicForm.extra.titbits}
                  onChange={e => setTopicForm(f => f && ({ ...f, extra: { ...f.extra, titbits: e.target.value } }))} />
              </div>
              <div>
                <label className={adminLabel}>Resources (one per line: Title | link)</label>
                <textarea className={adminInput} rows={3} value={topicForm.extra.resources}
                  onChange={e => setTopicForm(f => f && ({ ...f, extra: { ...f.extra, resources: e.target.value } }))} />
              </div>
              <div>
                <label className={adminLabel}>Summary</label>
                <textarea className={adminInput} rows={3} value={topicForm.extra.summary}
                  onChange={e => setTopicForm(f => f && ({ ...f, extra: { ...f.extra, summary: e.target.value } }))} />
              </div>
              <div>
                <label className={adminLabel}>Revision notes</label>
                <textarea className={adminInput} rows={4} value={topicForm.extra.revision}
                  onChange={e => setTopicForm(f => f && ({ ...f, extra: { ...f.extra, revision: e.target.value } }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <AdminButton variant="ghost" className="flex-1" onClick={() => setTopicForm(null)}>Cancel</AdminButton>
              <AdminButton className="flex-1" onClick={saveTopic} disabled={saving}>
                {saving ? 'Saving…' : topicForm.id ? 'Save changes' : 'Create topic'}
              </AdminButton>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  // ── Subject list ────────────────────────────────────────
  return (
    <div>
            {error && (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-400">{error}</div>
      )}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-admin-muted">
          {subjects.length} subject{subjects.length === 1 ? '' : 's'} · {topics.length} topic{topics.length === 1 ? '' : 's'}
        </p>
        <AdminButton onClick={() => { setError(''); setSubjectForm({ ...emptySubjectForm }) }}>
          <Plus size={15} /> New subject
        </AdminButton>
      </div>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" note='Click "New subject", or use the Import tab to add everything from a file.' />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {subjects.map(s => (
            <AdminCard key={s.id} className="p-4!">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setSelectedSubjectId(s.id)} className="text-left min-w-0 flex-1">
                  <p className="text-white font-bold truncate">{s.name}</p>
                  <p className="text-xs text-admin-muted mt-0.5">{topicsFor(s.id).length} topics</p>
                  {s.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</p>}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setError(''); setSubjectForm({ id: s.id, name: s.name, description: s.description ?? '' }) }}
                    className="p-1.5 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card" aria-label="Edit subject"><Pencil size={14} /></button>
                  <button onClick={() => deleteSubject(s)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" aria-label="Delete subject"><Trash2 size={14} /></button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {subjectForm && (
        <Modal title={subjectForm.id ? 'Edit subject' : 'New subject'} onClose={() => setSubjectForm(null)}>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className={adminLabel}>Name</label>
              <input className={adminInput} value={subjectForm.name}
                onChange={e => setSubjectForm(f => f && ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={adminLabel}>Description</label>
              <textarea className={adminInput} rows={3} value={subjectForm.description}
                onChange={e => setSubjectForm(f => f && ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <AdminButton variant="ghost" className="flex-1" onClick={() => setSubjectForm(null)}>Cancel</AdminButton>
            <AdminButton className="flex-1" onClick={saveSubject} disabled={saving}>
              {saving ? 'Saving…' : subjectForm.id ? 'Save changes' : 'Create subject'}
            </AdminButton>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-admin-surface border border-admin-border rounded-2xl w-full max-h-[90vh] overflow-y-auto p-6 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
