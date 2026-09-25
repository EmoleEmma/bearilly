'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Trash2, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AdminButton, AdminCard, EmptyState, adminInput, adminLabel } from '@/components/admin/ui'
import { KINDS, KIND_LABEL, type Kind, type Difficulty } from '@/lib/import/types'
import { checkPracticeSize, checkMockSize } from '@/lib/import/rules'

type Subject = { id: string; name: string; order_index: number }
type Topic = { id: string; subject_id: string; title: string; order_index: number }

type QuestionRow = {
  id: string
  lesson_id: string | null
  kind: Kind | null
  difficulty: Difficulty | null
  question: string
  options: string[]
  answer: string
  explanation: string | null
}

type Form = {
  id: string | null
  kind: Kind
  difficulty: Difficulty | ''
  question: string
  options: [string, string, string, string]
  answerIndex: number
  explanation: string
}

const NON_MOCK_KINDS = KINDS.filter(k => k !== 'mock_exam')

function emptyForm(kind: Kind): Form {
  return { id: null, kind, difficulty: kind === 'practice' ? 'easy' : '', question: '', options: ['', '', '', ''], answerIndex: 0, explanation: '' }
}

export default function QuestionsTab({ trackId }: { trackId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [mockQuestions, setMockQuestions] = useState<QuestionRow[]>([])
  const [view, setView] = useState<'topics' | 'mock' | 'subject'>('topics')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form | null>(null)
  const [openKind, setOpenKind] = useState<Kind | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const [subjRes, topicRes, mockRes] = await Promise.all([
      supabase.from('subjects').select('id, name, order_index').eq('school_id', trackId).order('order_index'),
      supabase.from('lessons').select('id, subject_id, title, order_index').eq('school_id', trackId).order('order_index'),
      supabase.from('quizzes')
        .select('id, lesson_id, kind, difficulty, question, options, answer, explanation')
        .eq('school_id', trackId).eq('kind', 'mock_exam'),
    ])
    if (subjRes.error) setError(`Could not load subjects: ${subjRes.error.message}`)
    else if (topicRes.error) setError(`Could not load topics: ${topicRes.error.message}`)
    else if (mockRes.error) setError(`Could not load the mock exam: ${mockRes.error.message}`)
    setSubjects((subjRes.data || []) as Subject[])
    setTopics((topicRes.data || []) as Topic[])
    setMockQuestions((mockRes.data || []) as QuestionRow[])
    setLoading(false)
  }, [trackId])

  useEffect(() => { load() }, [load])

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? null
  const selectedTopic = topics.find(t => t.id === selectedTopicId) ?? null
  const topicsFor = (subjectId: string) => topics.filter(t => t.subject_id === subjectId).sort((a, b) => a.order_index - b.order_index)

  const loadTopicQuestions = useCallback(async (topicId: string) => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('quizzes')
      .select('id, lesson_id, kind, difficulty, question, options, answer, explanation')
      .eq('lesson_id', topicId).not('kind', 'is', null)
    if (e) setError(`Could not load questions: ${e.message}`)
    setQuestions((data || []) as QuestionRow[])
    setLoading(false)
  }, [])

  // Subject-wide questions: lesson_id IS NULL, subject_id = this subject. Kept
  // separate from loadTopicQuestions() so switching between a topic and the
  // subject-wide test can never accidentally mix the two lists.
  const loadSubjectQuestions = useCallback(async (subjectId: string) => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('quizzes')
      .select('id, lesson_id, kind, difficulty, question, options, answer, explanation')
      .eq('subject_id', subjectId).is('lesson_id', null).not('kind', 'is', null)
    if (e) setError(`Could not load questions: ${e.message}`)
    setQuestions((data || []) as QuestionRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (view === 'subject' && selectedSubjectId) loadSubjectQuestions(selectedSubjectId)
    else if (view === 'topics' && selectedTopicId) loadTopicQuestions(selectedTopicId)
  }, [selectedTopicId, selectedSubjectId, view, loadTopicQuestions, loadSubjectQuestions])

  const byKind = useMemo(() => {
    const m = new Map<Kind, QuestionRow[]>()
    for (const k of NON_MOCK_KINDS) m.set(k, [])
    for (const q of questions) if (q.kind && m.has(q.kind)) m.get(q.kind)!.push(q)
    return m
  }, [questions])

  const practiceCounts = useMemo(() => {
    const list = byKind.get('practice') ?? []
    return {
      easy: list.filter(q => q.difficulty === 'easy').length,
      medium: list.filter(q => q.difficulty === 'medium').length,
      hard: list.filter(q => q.difficulty === 'hard').length,
    }
  }, [byKind])

  async function saveQuestion() {
    if (!form) return
    setError('')
    const question = form.question.trim()
    if (!question) { setError('Question text is required.'); return }
    const opts = form.options.map(o => o.trim())
    const filled = opts.filter(Boolean)
    if (filled.length < 2) { setError('At least two answer options are needed.'); return }
    if (!opts[form.answerIndex]) { setError(`Answer is Option ${'ABCD'[form.answerIndex]} but that option is empty.`); return }
    if (form.kind === 'practice' && !form.difficulty) { setError('Practice questions need a difficulty.'); return }
    if (form.kind === 'practice' && !form.explanation.trim()) { setError('Practice questions need an explanation.'); return }

    setSaving(true)
    const supabase = createClient()
    const payload = {
      kind: form.kind,
      difficulty: form.kind === 'practice' ? form.difficulty : null,
      question,
      options: filled,
      answer: opts[form.answerIndex],
      explanation: form.explanation.trim() || null,
    }

    if (form.id) {
      const { error: e } = await supabase.from('quizzes').update(payload).eq('id', form.id)
      if (e) { setError('Failed to save question.'); setSaving(false); return }
    } else if (view === 'mock') {
      const { error: e } = await supabase.from('quizzes').insert({ ...payload, school_id: trackId, lesson_id: null })
      if (e) { setError('Failed to save question.'); setSaving(false); return }
    } else if (view === 'subject' && selectedSubject) {
      // A subject-wide test question (e.g. the "finish all topics" quiz):
      // scoped to the subject, with no single topic.
      const { error: e } = await supabase.from('quizzes').insert({
        ...payload, school_id: trackId, lesson_id: null, subject_id: selectedSubject.id,
      })
      if (e) { setError('Failed to save question.'); setSaving(false); return }
    } else if (selectedTopic) {
      const { error: e } = await supabase.from('quizzes').insert({
        ...payload, school_id: trackId, lesson_id: selectedTopic.id, subject_id: selectedTopic.subject_id,
      })
      if (e) { setError('Failed to save question.'); setSaving(false); return }
    }

    setSaving(false)
    setForm(null)
    if (view === 'mock') load()
    else if (view === 'subject' && selectedSubjectId) loadSubjectQuestions(selectedSubjectId)
    else if (selectedTopicId) loadTopicQuestions(selectedTopicId)
  }

  async function deleteQuestion(q: QuestionRow) {
    if (!confirm('Delete this question?')) return
    const supabase = createClient()
    await supabase.from('quizzes').delete().eq('id', q.id)
    if (view === 'mock') load()
    else if (view === 'subject' && selectedSubjectId) loadSubjectQuestions(selectedSubjectId)
    else if (selectedTopicId) loadTopicQuestions(selectedTopicId)
  }

  function openEdit(q: QuestionRow) {
    setError('')
    const idx = q.options.findIndex(o => o === q.answer)
    setForm({
      id: q.id, kind: (q.kind ?? 'practice') as Kind, difficulty: (q.difficulty ?? '') as Difficulty | '',
      question: q.question,
      options: [q.options[0] ?? '', q.options[1] ?? '', q.options[2] ?? '', q.options[3] ?? ''],
      answerIndex: idx >= 0 ? idx : 0,
      explanation: q.explanation ?? '',
    })
  }

  if (loading && subjects.length === 0) return <div className="h-40 rounded-xl bg-admin-surface animate-pulse" />

  // ── Mock exam view ──────────────────────────────────────
  if (view === 'mock') {
    const check = checkMockSize(mockQuestions.length)
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <button onClick={() => setView('topics')} className="text-sm text-admin-muted hover:text-white flex items-center gap-1">
            <ChevronRight size={14} className="rotate-180" /> Back to topics
          </button>
          <AdminButton onClick={() => setForm(emptyForm('mock_exam'))}><Plus size={15} /> New mock question</AdminButton>
        </div>
        <SizeBanner ok={check.ok} message={check.message} okLabel="Exactly 100 questions." />
        {error && <ErrorBanner message={error} />}
        <QuestionList questions={mockQuestions} onEdit={openEdit} onDelete={deleteQuestion} emptyNote="No mock exam questions yet." />
        {form && <QuestionModal form={form} setForm={setForm} saving={saving} onCancel={() => setForm(null)} onSave={saveQuestion} showDifficulty={false} />}
      </div>
    )
  }

  // ── One topic's questions ───────────────────────────────
  if (selectedTopic && selectedSubject) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
          <button onClick={() => { setSelectedTopicId(null) }} className="text-admin-muted hover:text-white">{selectedSubject.name}</button>
          <ChevronRight size={14} className="text-slate-500" />
          <span className="text-white font-semibold">{selectedTopic.title}</span>
        </div>
        {error && <ErrorBanner message={error} />}

        <div className="space-y-3">
          {NON_MOCK_KINDS.map(kind => {
            const list = byKind.get(kind) ?? []
            const isOpen = openKind === kind
            const check = kind === 'practice' ? checkPracticeSize(practiceCounts.easy, practiceCounts.medium, practiceCounts.hard) : null
            return (
              <AdminCard key={kind} className="!p-0 overflow-hidden">
                <button onClick={() => setOpenKind(isOpen ? null : kind)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={16} className={`text-admin-muted transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    <span className="text-white font-bold">{KIND_LABEL[kind]}</span>
                    <span className="text-admin-muted text-sm">· {list.length} question{list.length === 1 ? '' : 's'}</span>
                  </div>
                  {check && (check.ok
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <AlertTriangle size={16} className="text-amber-400" />)}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-admin-border/30 pt-4">
                    {check && <SizeBanner ok={check.ok} message={check.message} okLabel="5 easy, 10 medium, 5 hard." compact />}
                    <div className="flex justify-end mb-3">
                      <AdminButton onClick={() => setForm(emptyForm(kind))}><Plus size={14} /> Add question</AdminButton>
                    </div>
                    <QuestionList questions={list} onEdit={openEdit} onDelete={deleteQuestion} emptyNote={`No ${KIND_LABEL[kind]} questions yet.`} />
                  </div>
                )}
              </AdminCard>
            )
          })}
        </div>

        {form && <QuestionModal form={form} setForm={setForm} saving={saving} onCancel={() => setForm(null)} onSave={saveQuestion} showDifficulty={form.kind === 'practice'} />}
      </div>
    )
  }

  // ── Subject-wide test for one subject ("finish all topics, take a quiz") ──
  if (view === 'subject' && selectedSubject) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
          <button onClick={() => { setView('topics') }} className="text-admin-muted hover:text-white">{selectedSubject.name}</button>
          <ChevronRight size={14} className="text-slate-500" />
          <span className="text-white font-semibold">Subject Test</span>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex justify-end mb-3">
          <AdminButton onClick={() => setForm(emptyForm('practice'))}><Plus size={14} /> Add question</AdminButton>
        </div>
        <QuestionList
          questions={questions.filter(q => q.kind !== null)}
          onEdit={openEdit}
          onDelete={deleteQuestion}
          emptyNote="No Subject Test questions yet. Students see this quiz once they finish every topic in this subject."
        />
        {form && <QuestionModal form={form} setForm={setForm} saving={saving} onCancel={() => setForm(null)} onSave={saveQuestion} showDifficulty={form.kind === 'practice'} />}
      </div>
    )
  }

  // ── One subject's topics ────────────────────────────────
  if (selectedSubject) {
    const list = topicsFor(selectedSubject.id)
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setSelectedSubjectId(null)} className="text-admin-muted hover:text-white">Subjects</button>
            <ChevronRight size={14} className="text-slate-500" />
            <span className="text-white font-semibold">{selectedSubject.name}</span>
          </div>
          <AdminButton variant="ghost" onClick={() => setView('subject')}>Subject Test</AdminButton>
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
        <p className="text-sm text-admin-muted">Pick a subject to manage its topics' questions.</p>
        <AdminButton variant="ghost" onClick={() => setView('mock')}>Mock Exam ({mockQuestions.length}/100)</AdminButton>
      </div>
      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" note="Add subjects in the Subjects & Topics tab first." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {subjects.map(s => (
            <button key={s.id} onClick={() => { setView('topics'); setSelectedSubjectId(s.id) }} className="text-left">
              <AdminCard className="!p-4 hover:border-admin-accent/50">
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

function SizeBanner({ ok, message, okLabel, compact }: { ok: boolean; message: string | null; okLabel: string; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${compact ? 'mb-3' : 'mb-4'} ${ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
      {ok ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertTriangle size={14} className="shrink-0" />}
      <span>{ok ? okLabel : message}</span>
    </div>
  )
}

function QuestionList({ questions, onEdit, onDelete, emptyNote }: {
  questions: QuestionRow[]; onEdit: (q: QuestionRow) => void; onDelete: (q: QuestionRow) => void; emptyNote: string
}) {
  if (questions.length === 0) return <p className="text-sm text-admin-muted py-3">{emptyNote}</p>
  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={q.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 bg-admin-card">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">
              <span className="text-admin-muted mr-2">{i + 1}.</span>{q.question}
              {q.difficulty && <span className="ml-2 text-xs text-admin-muted uppercase">{q.difficulty}</span>}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(q)} className="p-1.5 rounded-lg text-admin-muted hover:text-white hover:bg-admin-surface" aria-label="Edit question"><Pencil size={14} /></button>
            <button onClick={() => onDelete(q)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" aria-label="Delete question"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionModal({ form, setForm, saving, onCancel, onSave, showDifficulty }: {
  form: Form; setForm: (f: Form | null) => void; saving: boolean; onCancel: () => void; onSave: () => void; showDifficulty: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{form.id ? 'Edit question' : 'New question'} · {KIND_LABEL[form.kind]}</h2>
          <button onClick={onCancel} className="p-1 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={adminLabel}>Question</label>
            <textarea className={adminInput} rows={2} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
          </div>
          {showDifficulty && (
            <div>
              <label className={adminLabel}>Difficulty</label>
              <select className={adminInput} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as Difficulty })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            {(['A', 'B', 'C', 'D'] as const).map((letter, i) => (
              <div key={letter} className="flex items-center gap-2">
                <input type="radio" name="answer" checked={form.answerIndex === i} onChange={() => setForm({ ...form, answerIndex: i })}
                  className="w-4 h-4 shrink-0" aria-label={`Option ${letter} is correct`} />
                <input className={adminInput} value={form.options[i]} placeholder={`Option ${letter}`}
                  onChange={e => { const opts = [...form.options] as [string, string, string, string]; opts[i] = e.target.value; setForm({ ...form, options: opts }) }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-admin-muted -mt-2">Select the circle next to the correct answer.</p>
          <div>
            <label className={adminLabel}>Explanation {showDifficulty && <span className="text-red-400">*</span>}</label>
            <textarea className={adminInput} rows={2} value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <AdminButton variant="ghost" className="flex-1" onClick={onCancel}>Cancel</AdminButton>
          <AdminButton className="flex-1" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Add question'}</AdminButton>
        </div>
      </div>
    </div>
  )
}
