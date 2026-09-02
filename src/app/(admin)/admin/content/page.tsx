'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, X, Pencil, Trash2, ChevronDown, BookOpen, HelpCircle, ClipboardList, Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Track = { id: string; name: string; slug: string }

type Lesson = {
  id: string
  category: string
  title: string
  description: string | null
  content: string | null
  example: string | null
  order_index: number
  school_id: string
}

type Quiz = {
  id: string
  lesson_id: string
  question: string
  options: string[] | null
  answer: string
}

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
  file_url: string | null
  school_id: string | null
}

type AssessmentForm = {
  id: string | null
  title: string
  description: string
  deadline: string
  file_url: string
}

const emptyAssessmentForm: AssessmentForm = {
  id: null, title: '', description: '', deadline: '', file_url: '',
}

type Tool = {
  id: string
  category: string
  tool_name: string
  tool_url: string
  description: string | null
  is_free: boolean
  school_id: string | null
}

type ToolForm = {
  id: string | null
  category: string
  tool_name: string
  tool_url: string
  description: string
  is_free: boolean
}

const emptyToolForm: ToolForm = {
  id: null, category: '', tool_name: '', tool_url: '', description: '', is_free: true,
}

type QuizForm = {
  id: string | null
  lessonId: string
  question: string
  options: string[]
  answer: string
}

const emptyQuizForm: QuizForm = {
  id: null, lessonId: '', question: '', options: ['', '', '', ''], answer: '',
}

type LessonForm = {
  id: string | null
  category: string
  title: string
  description: string
  content: string
  example: string
}

const emptyLessonForm: LessonForm = {
  id: null, category: '', title: '', description: '', content: '', example: '',
}

const TABS = [
  { key: 'lessons', label: 'Lessons', icon: BookOpen },
  { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { key: 'assessments', label: 'Assessments', icon: ClipboardList },
  { key: 'toolkit', label: 'Toolkit', icon: Wrench },
] as const

type TabKey = typeof TABS[number]['key']

export default function ManageContentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedTrackId, setSelectedTrackId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabKey>('lessons')
  const [tracksLoading, setTracksLoading] = useState(true)

  useEffect(() => { loadTracks() }, [])

  async function loadTracks() {
    setTracksLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('schools')
      .select('id, name, slug')
      .order('order_index')
    setTracks((data || []) as Track[])
    setTracksLoading(false)

    const preselect = searchParams.get('track')
    if (preselect && data?.some(t => t.id === preselect)) {
      setSelectedTrackId(preselect)
    } else if (data && data.length > 0) {
      setSelectedTrackId(data[0].id)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-admin-deep">Manage Content</h1>
        <p className="text-sm text-admin-slate/60 mt-1">
          Pick a track, then add lessons, quizzes, assessments, and tools — no code required.
        </p>
      </div>

      {/* Track picker */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Track</label>
        {tracksLoading ? (
          <div className="h-11 w-64 bg-white rounded-lg animate-pulse" />
        ) : tracks.length === 0 ? (
          <p className="text-sm text-admin-slate/50">No tracks exist yet. Create one under Tracks first.</p>
        ) : (
          <div className="relative w-full sm:w-72">
            <select
              value={selectedTrackId}
              onChange={e => setSelectedTrackId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-9 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-admin-deep focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
            >
              {tracks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-slate/40 pointer-events-none" />
          </div>
        )}
      </div>

      {selectedTrackId && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-admin-teal text-admin-teal'
                    : 'border-transparent text-admin-slate/50 hover:text-admin-slate'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'lessons' && <LessonsTab trackId={selectedTrackId} />}
          {activeTab === 'quizzes' && <QuizzesTab trackId={selectedTrackId} />}
          {activeTab === 'assessments' && <AssessmentsTab trackId={selectedTrackId} />}
          {activeTab === 'toolkit' && <ToolkitTab trackId={selectedTrackId} />}
        </>
      )}
    </div>
  )
}

function EmptyTabState({ label, note }: { label: string; note: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-xl">
      <p className="text-sm font-bold text-admin-slate/60">{label} — not built yet</p>
      <p className="text-xs text-admin-slate/40 mt-1 max-w-xs mx-auto">{note}</p>
    </div>
  )
}

function LessonsTab({ trackId }: { trackId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<LessonForm>(emptyLessonForm)

  useEffect(() => { load() }, [trackId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('lessons')
      .select('id, category, title, description, content, example, order_index, school_id')
      .eq('school_id', trackId)
      .order('category')
      .order('order_index')
    setLessons((data || []) as Lesson[])
    setLoading(false)
  }

  function openNewForm() {
    setForm(emptyLessonForm)
    setError('')
    setShowForm(true)
  }

  function openEditForm(lesson: Lesson) {
    setForm({
      id: lesson.id,
      category: lesson.category,
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      example: lesson.example || '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyLessonForm)
    setError('')
  }

  async function handleSave() {
    setError('')
    if (!form.title.trim()) { setError('Lesson title is required.'); return }
    if (!form.category.trim()) { setError('Category is required.'); return }
    if (!form.content.trim()) { setError('Lesson content is required.'); return }

    const payload = {
      category: form.category.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      content: form.content.trim(),
      example: form.example.trim() || null,
      school_id: trackId,
    }

    setSaving(true)
    const supabase = createClient()

    if (form.id) {
      const { error: updateError } = await supabase.from('lessons').update(payload).eq('id', form.id)
      if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    } else {
      const existingInCategory = lessons.filter(l => l.category === payload.category).length
      const { error: insertError } = await supabase
        .from('lessons')
        .insert({ ...payload, order_index: existingInCategory })
      if (insertError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    }

    setSaving(false)
    closeForm()
    load()
  }

  async function handleDelete(lesson: Lesson) {
    if (!confirm(`Delete "${lesson.title}"? This also deletes any quizzes attached to it.`)) return
    const supabase = createClient()
    await supabase.from('lessons').delete().eq('id', lesson.id)
    load()
  }

  // Group lessons by category for a clearer overview
  const byCategory = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    (acc[l.category] ||= []).push(l)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-admin-slate/60">
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} across {Object.keys(byCategory).length} categor{Object.keys(byCategory).length !== 1 ? 'ies' : 'y'}
        </p>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#4F7C82' }}
        >
          <Plus size={15} /> New Lesson
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && lessons.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          No lessons yet for this track. Click "New Lesson" to add the first one.
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(byCategory).map(([category, categoryLessons]) => (
          <div key={category}>
            <p className="text-xs font-bold text-admin-slate/50 uppercase tracking-wide mb-2">{category}</p>
            <div className="space-y-2">
              {categoryLessons.map(lesson => (
                <div key={lesson.id} className="bg-white rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <p className="text-sm font-semibold text-admin-deep truncate">{lesson.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditForm(lesson)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Edit lesson">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(lesson)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" aria-label="Delete lesson">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-admin-deep">{form.id ? 'Edit Lesson' : 'New Lesson'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Fundamentals"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Lesson title"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="One line shown in lesson lists"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Lesson Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="The full lesson text (400–1,200 words recommended)"
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Example (optional)</label>
                <textarea
                  value={form.example}
                  onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
                  placeholder="A worked example or illustration, if useful"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-y"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-admin-slate/70 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#4F7C82' }}
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuizzesTab({ trackId }: { trackId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [lessonFilter, setLessonFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<QuizForm>(emptyQuizForm)

  useEffect(() => { load() }, [trackId])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: lessonData } = await supabase
      .from('lessons')
      .select('id, category, title, description, content, example, order_index, school_id')
      .eq('school_id', trackId)
      .order('category')
      .order('order_index')

    const lessonIds = (lessonData || []).map(l => l.id)
    let quizData: Quiz[] = []
    if (lessonIds.length > 0) {
      const { data } = await supabase
        .from('quizzes')
        .select('id, lesson_id, question, options, answer')
        .in('lesson_id', lessonIds)
      quizData = (data || []) as Quiz[]
    }

    setLessons((lessonData || []) as Lesson[])
    setQuizzes(quizData)
    setLoading(false)
  }

  function lessonTitle(lessonId: string) {
    return lessons.find(l => l.id === lessonId)?.title || 'Unknown lesson'
  }

  function openNewForm() {
    setForm({ ...emptyQuizForm, lessonId: lessonFilter !== 'all' ? lessonFilter : (lessons[0]?.id || '') })
    setError('')
    setShowForm(true)
  }

  function openEditForm(quiz: Quiz) {
    const opts = quiz.options && quiz.options.length > 0 ? quiz.options : ['', '', '', '']
    setForm({
      id: quiz.id,
      lessonId: quiz.lesson_id,
      question: quiz.question,
      options: opts.length < 4 ? [...opts, ...Array(4 - opts.length).fill('')] : opts,
      answer: quiz.answer,
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyQuizForm)
    setError('')
  }

  function updateOption(index: number, value: string) {
    setForm(f => {
      const next = [...f.options]
      next[index] = value
      return { ...f, options: next }
    })
  }

  async function handleSave() {
    setError('')
    if (!form.lessonId) { setError('Select a lesson for this question.'); return }
    if (!form.question.trim()) { setError('Question text is required.'); return }
    const filledOptions = form.options.map(o => o.trim()).filter(Boolean)
    if (filledOptions.length < 2) { setError('Add at least 2 answer options.'); return }
    if (!form.answer.trim()) { setError('Select the correct answer.'); return }
    if (!filledOptions.includes(form.answer.trim())) { setError('The correct answer must match one of the options exactly.'); return }

    const payload = {
      lesson_id: form.lessonId,
      question: form.question.trim(),
      options: filledOptions,
      answer: form.answer.trim(),
    }

    setSaving(true)
    const supabase = createClient()

    if (form.id) {
      const { error: updateError } = await supabase.from('quizzes').update(payload).eq('id', form.id)
      if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase.from('quizzes').insert(payload)
      if (insertError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    }

    setSaving(false)
    closeForm()
    load()
  }

  async function handleDelete(quiz: Quiz) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('quizzes').delete().eq('id', quiz.id)
    load()
  }

  const filteredQuizzes = lessonFilter === 'all'
    ? quizzes
    : quizzes.filter(q => q.lesson_id === lessonFilter)

  if (!loading && lessons.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl">
        <p className="text-sm font-bold text-admin-slate/60">No lessons yet in this track</p>
        <p className="text-xs text-admin-slate/40 mt-1">Add a lesson first — quizzes are tied to a specific lesson.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-64">
          <select
            value={lessonFilter}
            onChange={e => setLessonFilter(e.target.value)}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-admin-deep focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
          >
            <option value="all">All lessons ({quizzes.length} questions)</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-slate/40 pointer-events-none" />
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#4F7C82' }}
        >
          <Plus size={15} /> New Question
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && filteredQuizzes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          No questions yet{lessonFilter !== 'all' ? ' for this lesson' : ''}. Click "New Question" to add one.
        </div>
      )}

      <div className="space-y-2">
        {filteredQuizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-lg p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-admin-teal uppercase tracking-wide mb-0.5">
                  {lessonTitle(quiz.lesson_id)}
                </p>
                <p className="text-sm font-semibold text-admin-deep">{quiz.question}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(quiz.options || []).map(opt => (
                    <span
                      key={opt}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        opt === quiz.answer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEditForm(quiz)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Edit question">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(quiz)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" aria-label="Delete question">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-admin-deep">{form.id ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Lesson</label>
                <div className="relative">
                  <select
                    value={form.lessonId}
                    onChange={e => setForm(f => ({ ...f, lessonId: e.target.value }))}
                    className="w-full appearance-none px-3 py-2.5 pr-9 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  >
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-slate/40 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Question</label>
                <textarea
                  value={form.question}
                  onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                  placeholder="What is being asked?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">
                  Answer Options — mark the correct one
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-answer"
                        checked={opt.trim().length > 0 && opt.trim() === form.answer.trim()}
                        onChange={() => setForm(f => ({ ...f, answer: opt }))}
                        disabled={!opt.trim()}
                        className="w-4 h-4 shrink-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          updateOption(i, e.target.value)
                          // Keep answer in sync if this option was already selected
                          setForm(f => f.answer === opt ? { ...f, answer: e.target.value } : f)
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-admin-slate/40 mt-1.5">Select the radio button next to the correct answer.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-admin-slate/70 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#4F7C82' }}
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AssessmentsTab({ trackId }: { trackId: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<AssessmentForm>(emptyAssessmentForm)

  useEffect(() => { load() }, [trackId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('assessments')
      .select('id, title, description, deadline, status, file_url, school_id')
      .eq('school_id', trackId)
      .order('deadline', { ascending: true })
    setAssessments((data || []) as Assessment[])
    setLoading(false)
  }

  function openNewForm() {
    setForm(emptyAssessmentForm)
    setError('')
    setShowForm(true)
  }

  function openEditForm(a: Assessment) {
    setForm({
      id: a.id,
      title: a.title,
      description: a.description || '',
      deadline: a.deadline ? a.deadline.slice(0, 10) : '',
      file_url: a.file_url || '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyAssessmentForm)
    setError('')
  }

  async function handleSave() {
    setError('')
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.description.trim()) { setError('Instructions/description are required.'); return }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline || null,
      file_url: form.file_url.trim() || null,
      school_id: trackId,
    }

    setSaving(true)
    const supabase = createClient()

    if (form.id) {
      const { error: updateError } = await supabase.from('assessments').update(payload).eq('id', form.id)
      if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase.from('assessments').insert({ ...payload, status: 'active' })
      if (insertError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    }

    setSaving(false)
    closeForm()
    load()
  }

  async function toggleStatus(a: Assessment) {
    const supabase = createClient()
    const newStatus = a.status === 'active' ? 'closed' : 'active'
    await supabase.from('assessments').update({ status: newStatus }).eq('id', a.id)
    setAssessments(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x))
  }

  async function handleDelete(a: Assessment) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('assessments').delete().eq('id', a.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-admin-slate/60">
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} for this track
        </p>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#4F7C82' }}
        >
          <Plus size={15} /> New Assessment
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && assessments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          No assessments yet for this track. Click "New Assessment" to add the first one.
        </div>
      )}

      <div className="space-y-2">
        {assessments.map(a => (
          <div key={a.id} className="bg-white rounded-lg p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-admin-deep truncate">{a.title}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.status === 'active' ? 'ACTIVE' : 'CLOSED'}
                </span>
              </div>
              {a.deadline && (
                <p className="text-xs text-admin-slate/50 mt-0.5">Due {new Date(a.deadline).toLocaleDateString()}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleStatus(a)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {a.status === 'active' ? 'Close' : 'Reopen'}
              </button>
              <button onClick={() => openEditForm(a)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Edit assessment">
                <Pencil size={13} />
              </button>
              <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" aria-label="Delete assessment">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-admin-deep">{form.id ? 'Edit Assessment' : 'New Assessment'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Final Project: Design a Molecule Model"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Instructions</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What the user needs to do, and how it will be graded"
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Deadline (optional)</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Instructions File URL (optional)</label>
                  <input
                    type="text"
                    value={form.file_url}
                    onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-admin-slate/70 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#4F7C82' }}
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolkitTab({ trackId }: { trackId: string }) {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ToolForm>(emptyToolForm)

  useEffect(() => { load() }, [trackId])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tool_directory')
      .select('id, category, tool_name, tool_url, description, is_free, school_id')
      .eq('school_id', trackId)
      .order('category')
    setTools((data || []) as Tool[])
    setLoading(false)
  }

  function openNewForm() {
    setForm(emptyToolForm)
    setError('')
    setShowForm(true)
  }

  function openEditForm(t: Tool) {
    setForm({
      id: t.id,
      category: t.category,
      tool_name: t.tool_name,
      tool_url: t.tool_url,
      description: t.description || '',
      is_free: t.is_free,
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(emptyToolForm)
    setError('')
  }

  async function handleSave() {
    setError('')
    if (!form.tool_name.trim()) { setError('Tool name is required.'); return }
    if (!form.category.trim()) { setError('Category is required.'); return }
    if (!form.tool_url.trim()) { setError('Tool link is required.'); return }
    try {
      new URL(form.tool_url.trim())
    } catch {
      setError('Enter a valid URL, including https://'); return
    }

    const payload = {
      category: form.category.trim(),
      tool_name: form.tool_name.trim(),
      tool_url: form.tool_url.trim(),
      description: form.description.trim() || null,
      is_free: form.is_free,
      school_id: trackId,
    }

    setSaving(true)
    const supabase = createClient()

    if (form.id) {
      const { error: updateError } = await supabase.from('tool_directory').update(payload).eq('id', form.id)
      if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase.from('tool_directory').insert(payload)
      if (insertError) { setError('Failed to save. Please try again.'); setSaving(false); return }
    }

    setSaving(false)
    closeForm()
    load()
  }

  async function handleDelete(t: Tool) {
    if (!confirm(`Delete "${t.tool_name}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('tool_directory').delete().eq('id', t.id)
    load()
  }

  const byCategory = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-admin-slate/60">
          {tools.length} tool{tools.length !== 1 ? 's' : ''} across {Object.keys(byCategory).length} categor{Object.keys(byCategory).length !== 1 ? 'ies' : 'y'}
        </p>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#4F7C82' }}
        >
          <Plus size={15} /> New Tool
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && tools.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          No tools yet for this track. Click "New Tool" to add the first one.
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(byCategory).map(([category, categoryTools]) => (
          <div key={category}>
            <p className="text-xs font-bold text-admin-slate/50 uppercase tracking-wide mb-2">{category}</p>
            <div className="space-y-2">
              {categoryTools.map(tool => (
                <div key={tool.id} className="bg-white rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-admin-deep truncate">{tool.tool_name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${tool.is_free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tool.is_free ? 'FREE' : 'PAID'}
                      </span>
                    </div>
                    <a href={tool.tool_url} target="_blank" rel="noopener noreferrer" className="text-xs text-admin-teal hover:underline truncate block">
                      {tool.tool_url}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditForm(tool)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Edit tool">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(tool)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" aria-label="Delete tool">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-admin-deep">{form.id ? 'Edit Tool' : 'New Tool'}</h2>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Simulation Tools"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Tool Name</label>
                  <input
                    type="text"
                    value={form.tool_name}
                    onChange={e => setForm(f => ({ ...f, tool_name: e.target.value }))}
                    placeholder="e.g. PhET Simulations"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Link</label>
                <input
                  type="text"
                  value={form.tool_url}
                  onChange={e => setForm(f => ({ ...f, tool_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-admin-slate/60 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="One or two sentences on what it does and why it's useful"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-admin-teal/30 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-admin-deep">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))}
                  className="w-4 h-4"
                />
                Free to use
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeForm} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-admin-slate/70 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#4F7C82' }}
              >
                {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
