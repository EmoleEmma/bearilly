'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSubject } from '@/lib/subjects'
import { KIND_LABEL, type Kind } from '@/lib/import/types'
import {
  ArrowLeft, ArrowRight, BookOpen, Lightbulb, CheckCircle2, ListChecks, Link2,
  FileText, RotateCcw, PenSquare, Target, Trophy, Clock, HelpCircle,
} from 'lucide-react'

type Lesson = {
  id: string; title: string; description: string | null; content: string; example: string | null
  order_index: number; subject_id: string | null
}
type NextLesson = { id: string; title: string; order_index: number }
type ContentMap = { titbits: string; resources: string; summary: string; revision: string }
type SetInfo = { type: Kind; question_count: number; time_limit_sec: number | null; pass_mark: number }

const TAB_ORDER = [
  { key: 'lesson', label: 'Lesson', icon: BookOpen },
  { key: 'titbits', label: 'Key Points', icon: ListChecks },
  { key: 'resources', label: 'Resources', icon: Link2 },
  { key: 'practice', label: 'Practice', icon: PenSquare },
  { key: 'knowledge_check', label: 'Knowledge Check', icon: HelpCircle },
  { key: 'application_test', label: 'Application Test', icon: Target },
  { key: 'mastery_test', label: 'Mastery Test', icon: Trophy },
  { key: 'summary', label: 'Summary', icon: FileText },
  { key: 'revision', label: 'Revision', icon: RotateCcw },
] as const
type TabKey = (typeof TAB_ORDER)[number]['key']
const TEST_KINDS: Kind[] = ['practice', 'knowledge_check', 'application_test', 'mastery_test']

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const { subject, loading: subjectLoading, notFound: subjectNotFound } = useSubject(slug)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null)
  const [content, setContent] = useState<ContentMap>({ titbits: '', resources: '', summary: '', revision: '' })
  const [sets, setSets] = useState<Record<Kind, SetInfo | null>>({
    practice: null, knowledge_check: null, application_test: null, mastery_test: null, mock_exam: null,
  })
  const [isCompleted, setIsCompleted] = useState(false)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('lesson')

  useEffect(() => { load() }, [lessonId])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons').select('id, title, description, content, example, order_index, subject_id').eq('id', lessonId).single()
      if (lessonError || !lessonData) { setError('Topic not found'); router.push(`/learn/${slug}`); return }
      setLesson(lessonData)

      const [{ data: nextData }, { data: contentRows }, { data: setRows }, { data: prog }] = await Promise.all([
        supabase.from('lessons').select('id, title, order_index')
          .eq('subject_id', lessonData.subject_id).gt('order_index', lessonData.order_index)
          .order('order_index').limit(1).maybeSingle(),
        supabase.from('topic_content').select('type, body').eq('lesson_id', lessonId),
        supabase.from('question_sets').select('type, question_count, time_limit_sec, pass_mark').eq('lesson_id', lessonId),
        supabase.from('progress').select('status').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle(),
      ])
      setNextLesson(nextData)

      const c: ContentMap = { titbits: '', resources: '', summary: '', revision: '' }
      for (const row of contentRows ?? []) if (row.type in c) c[row.type as keyof ContentMap] = row.body ?? ''
      setContent(c)

      const s: Record<Kind, SetInfo | null> = { practice: null, knowledge_check: null, application_test: null, mastery_test: null, mock_exam: null }
      for (const row of setRows ?? []) s[row.type as Kind] = row as SetInfo
      setSets(s)

      setIsCompleted(prog?.status === 'completed')
      if (!prog) {
        await supabase.from('progress').upsert(
          { user_id: user.id, lesson_id: lessonId, status: 'started', updated_at: new Date().toISOString() },
          { onConflict: 'user_id,lesson_id' })
      }
    } catch (err) {
      console.error('Topic load error:', err)
      setError('Failed to load this topic')
    } finally {
      setLoading(false)
    }
  }

  async function markComplete() {
    if (!lessonId || marking) return
    setMarking(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('progress').upsert(
        { user_id: user.id, lesson_id: lessonId, status: 'completed', updated_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' })
      setIsCompleted(true)
    } finally {
      setMarking(false)
    }
  }

  if (loading || subjectLoading) {
    return <div className="max-w-3xl mx-auto text-center py-20 font-medium text-slate-400">Loading topic…</div>
  }
  if (error || !lesson || subjectNotFound || !subject) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white border border-slate-200 rounded-2xl my-10 shadow-sm">
        <p className="text-red-500 font-semibold mb-4">{error || 'This topic could not be found.'}</p>
        <Link href={`/learn/${slug}`} className="text-user-gold font-bold hover:underline text-sm inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Back to {subject?.name ?? 'Learning Hub'}
        </Link>
      </div>
    )
  }

  const { Icon } = subject

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#8B7355] mb-6 tracking-wide">
        <Link href="/learn" className="hover:text-[#4F7C82] transition-colors">Learning Hub</Link>
        <span className="text-[#E8E0D0]">/</span>
        <Link href={`/learn/${slug}`} className="hover:text-[#4F7C82] transition-colors">{subject.name}</Link>
        <span className="text-[#E8E0D0]">/</span>
        <span className="text-[#2D2416] truncate max-w-[240px] font-bold">{lesson.title}</span>
      </div>

      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-[0.04] pointer-events-none text-[#C89B5A]">
          <Icon size={180} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-[#F8F5EF] border border-[#E8E0D0]">
            <Icon size={16} style={{ color: '#4F7C82' }} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-[#8B7355]">{subject.name}</span>
        </div>
        <h1 className="text-[#2D2416] text-2xl md:text-3xl font-black tracking-tight mb-2">{lesson.title}</h1>
        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={13} className="text-emerald-600" /> Lesson Complete
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-[#E8E0D0]">
        {TAB_ORDER.map(({ key, label, icon: TabIcon }) => {
          const testKind = TEST_KINDS.includes(key as Kind) ? (key as Kind) : null
          const count = testKind ? sets[testKind]?.question_count ?? 0 : null
          return (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? 'border-[#4F7C82] text-[#2D2416]' : 'border-transparent text-[#8B7355] hover:text-[#2D2416]'
              }`}>
              <TabIcon size={14} /> {label}
              {count !== null && count > 0 && <span className="text-[10px] text-[#8B7355]">({count})</span>}
            </button>
          )
        })}
      </div>

      {tab === 'lesson' && (
        <>
          <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 shadow-md max-w-3xl mx-auto">
            <h2 className="text-[#2D2416] font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-[#E8E0D0]">
              <BookOpen size={16} className="text-[#4F7C82]" /> Lesson Content
            </h2>
            <div className="text-[#2D2416] text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium" style={{ lineHeight: '1.7' }}>
              {lesson.content}
            </div>
          </div>
          {lesson.example && (
            <div className="border-l-4 border-l-[#C89B5A] bg-[#FDF9F3] rounded-r-2xl rounded-l-sm p-6 mb-8 max-w-3xl mx-auto">
              <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-[#2D2416]">
                <Lightbulb size={16} className="text-[#C89B5A]" /> Real-World Example
              </h3>
              <p className="text-[#4A3520] text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ lineHeight: '1.7' }}>{lesson.example}</p>
            </div>
          )}
        </>
      )}

      {tab === 'titbits' && (
        <TextPanel icon={ListChecks} title="Key Points" empty="No key points added for this topic yet.">
          {content.titbits ? (
            <ul className="space-y-2.5">
              {content.titbits.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-[#2D2416] font-medium">
                  <CheckCircle2 size={16} className="text-[#4F7C82] mt-0.5 shrink-0" /> {line}
                </li>
              ))}
            </ul>
          ) : null}
        </TextPanel>
      )}

      {tab === 'resources' && (
        <TextPanel icon={Link2} title="Resources" empty="No supporting resources added for this topic yet.">
          {content.resources ? (
            <ul className="space-y-2">
              {content.resources.split('\n').filter(Boolean).map((line, i) => {
                const [label, url] = line.split('|').map(s => s.trim())
                return (
                  <li key={i}>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[#4F7C82] font-bold text-sm hover:underline inline-flex items-center gap-1.5">
                        <Link2 size={14} /> {label || url}
                      </a>
                    ) : <span className="text-sm text-[#2D2416]">{label}</span>}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </TextPanel>
      )}

      {tab === 'summary' && (
        <TextPanel icon={FileText} title="Summary" empty="No summary added for this topic yet.">
          {content.summary ? <p className="text-sm md:text-base text-[#2D2416] font-medium whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>{content.summary}</p> : null}
        </TextPanel>
      )}

      {tab === 'revision' && (
        <TextPanel icon={RotateCcw} title="Revision Notes" empty="No revision notes added for this topic yet.">
          {content.revision ? <p className="text-sm md:text-base text-[#2D2416] font-medium whitespace-pre-wrap" style={{ lineHeight: '1.7' }}>{content.revision}</p> : null}
        </TextPanel>
      )}

      {TEST_KINDS.includes(tab as Kind) && (
        <TestPanel kind={tab as Kind} set={sets[tab as Kind]} slug={slug} lessonId={lessonId} />
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-[#E8E0D0] pt-6 max-w-3xl mx-auto mt-6">
        <Link href={`/learn/${slug}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-[#4F7C82] bg-white border-2 border-[#4F7C82] hover:bg-[#F8F5EF] transition-all">
          <ArrowLeft size={14} /> Back to {subject.name}
        </Link>
        <div className="flex gap-3 w-full sm:w-auto">
          {!isCompleted ? (
            <button onClick={markComplete} disabled={marking}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-black text-sm text-white transition-all bg-[#4F7C82] hover:bg-[#3d6068] shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60">
              {marking ? 'Saving...' : 'Mark Complete ✓'}
            </button>
          ) : nextLesson ? (
            <Link href={`/learn/${slug}/${nextLesson.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#C89B5A] hover:bg-[#b8893a] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
              Next Topic <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href={`/learn/${slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#3d6068] shadow-md transition-all">
              Finish Subject <ArrowLeft size={14} />
            </Link>
          )}
        </div>
      </div>

      <Link href="/ai-tutor"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#4F7C82] hover:bg-[#3d6068] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 text-xl"
        title="Ask AI Help">
        🐻
      </Link>
    </div>
  )
}

function TextPanel({ icon: Icon, title, empty, children }: {
  icon: typeof BookOpen; title: string; empty: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 shadow-md max-w-3xl mx-auto">
      <h2 className="text-[#2D2416] font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-[#E8E0D0]">
        <Icon size={16} className="text-[#4F7C82]" /> {title}
      </h2>
      {children ?? <p className="text-sm text-[#8B7355]">{empty}</p>}
      {!children && <p className="text-sm text-[#8B7355]">{empty}</p>}
    </div>
  )
}

function TestPanel({ kind, set, slug, lessonId }: { kind: Kind; set: SetInfo | null; slug: string; lessonId: string }) {
  if (!set || set.question_count === 0) {
    return (
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 shadow-md max-w-3xl mx-auto text-center">
        <p className="text-sm text-[#8B7355]">The {KIND_LABEL[kind]} for this topic isn't ready yet. Check back soon.</p>
      </div>
    )
  }
  const minutes = set.time_limit_sec ? Math.round(set.time_limit_sec / 60) : null
  return (
    <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 shadow-md max-w-3xl mx-auto text-center">
      <h2 className="text-[#2D2416] font-black text-lg mb-2">{KIND_LABEL[kind]}</h2>
      <div className="flex items-center justify-center gap-4 text-sm text-[#8B7355] font-semibold mb-6">
        <span>{set.question_count} question{set.question_count === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><Clock size={13} /> {minutes ? `${minutes} min` : 'Untimed'}</span>
        <span>Pass mark: {set.pass_mark}%</span>
      </div>
      <Link href={`/learn/${slug}/${lessonId}/take/${kind}`}
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#3d6068] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
        Start {KIND_LABEL[kind]}
      </Link>
    </div>
  )
}
