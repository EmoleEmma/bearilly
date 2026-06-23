'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Lightbulb, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Camera, Megaphone, Rocket, Briefcase, Zap, Monitor, DollarSign } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const categoryMap: Record<string, { name: string; Icon: LucideIcon; accent: string }> = {
  'content-creation':   { name: 'Content Creation',   Icon: Camera,     accent: '#C89B5A' },
  'digital-marketing':  { name: 'Digital Marketing',   Icon: Megaphone,  accent: '#4F7C82' },
  'entrepreneurship':   { name: 'Entrepreneurship',    Icon: Lightbulb,  accent: '#C89B5A' },
  'career-development': { name: 'Career Development',  Icon: Rocket,     accent: '#4F7C82' },
  'business-skills':    { name: 'Business Skills',     Icon: Briefcase,  accent: '#C89B5A' },
  'productivity':       { name: 'Productivity',        Icon: Zap,        accent: '#4F7C82' },
  'technology':         { name: 'Technology',          Icon: Monitor,    accent: '#4F7C82' },
  'financial-literacy': { name: 'Financial Literacy',  Icon: DollarSign, accent: '#C89B5A' },
}

type Lesson = {
  id: string
  title: string
  description: string
  content: string
  example: string
  order_index: number
  category: string
}

type NextLesson = {
  id: string
  title: string
  description?: string
  order_index: number
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const cat = categoryMap[slug]

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [marking, setMarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [lessonId])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()

      if (lessonError || !lessonData) {
        setError('Lesson not found')
        router.push(`/learn/${slug}`)
        return
      }
      setLesson(lessonData)

      const { data: nextData } = await supabase
        .from('lessons')
        .select('id, title, description, order_index')
        .eq('category', lessonData.category)
        .gt('order_index', lessonData.order_index)
        .order('order_index')
        .limit(1)
        .maybeSingle()
      setNextLesson(nextData)

      const { data: prog } = await supabase
        .from('progress').select('status')
        .eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle()
      setIsCompleted(prog?.status === 'completed')

      if (!prog) {
        await supabase.from('progress').upsert({
          user_id: user.id, lesson_id: lessonId,
          status: 'started', updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
      }
    } catch (err) {
      console.error('Lesson load error:', err)
      setError('Failed to load lesson')
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
      await supabase.from('progress').upsert({
        user_id: user.id, lesson_id: lessonId,
        status: 'completed', updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })
      setIsCompleted(true)
    } catch (err) {
      console.error('Mark complete error:', err)
    } finally {
      setMarking(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto text-center py-20 font-medium text-slate-400">Loading learning workspace…</div>
  )

  if (error || !lesson || !cat) return (
    <div className="max-w-2xl mx-auto text-center py-16 bg-white border border-slate-200 rounded-2xl my-10 shadow-sm">
      <p className="text-red-500 font-semibold mb-4">{error || 'Lesson parameters unreadable.'}</p>
      <Link href={`/learn/${slug}`} className="text-user-gold font-bold hover:underline text-sm inline-flex items-center gap-1">
        <ArrowLeft size={14} /> Back to Course Directory
      </Link>
    </div>
  )

  const { Icon, accent } = cat

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Breadcrumb Navigation Block */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#8B7355] mb-6 tracking-wide">
        <Link href="/learn" className="hover:text-[#4F7C82] transition-colors">Learning Hub</Link>
        <span className="text-[#E8E0D0]">/</span>
        <Link href={`/learn/${slug}`} className="hover:text-[#4F7C82] transition-colors">{cat.name}</Link>
        <span className="text-[#E8E0D0]">/</span>
        <span className="text-[#2D2416] truncate max-w-[240px] font-bold">{lesson.title}</span>
      </div>

      {/* Lesson Banner */}
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-4 pointer-events-none text-[#C89B5A]">
          <Icon size={180} />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-[#F8F5EF] border border-[#E8E0D0]">
            <Icon size={16} style={{ color: '#4F7C82' }} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-[#8B7355]">
            {cat.name}
          </span>
        </div>

        <h1 className="text-[#2D2416] text-2xl md:text-3xl font-black tracking-tight mb-2">{lesson.title}</h1>
        
        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={13} className="text-emerald-600" /> Lesson Complete
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 mb-6 shadow-md max-w-3xl mx-auto">
        <h2 className="text-[#2D2416] font-black text-sm uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-[#E8E0D0]">
          <BookOpen size={16} className="text-[#4F7C82]" /> Lesson Content
        </h2>
        <div className="text-[#2D2416] text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium space-y-4" style={{ lineHeight: '1.7' }}>
          {lesson.content}
        </div>
      </div>

      {lesson.example && (
        <div className="border-l-4 border-l-[#C89B5A] bg-[#FDF9F3] rounded-r-2xl rounded-l-sm p-6 mb-8 max-w-3xl mx-auto">
          <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-[#2D2416]">
            <Lightbulb size={16} className="text-[#C89B5A]" /> Real-World Example
          </h3>
          <p className="text-[#4A3520] text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ lineHeight: '1.7' }}>
            {lesson.example}
          </p>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-[#E8E0D0] pt-6 max-w-3xl mx-auto">
        <Link
          href={`/learn/${slug}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-[#4F7C82] bg-white border-2 border-[#4F7C82] hover:bg-[#F8F5EF] transition-all"
        >
          <ArrowLeft size={14} /> Previous Lesson
        </Link>

        <div className="flex gap-3 w-full sm:w-auto">
          {!isCompleted ? (
            <button
              onClick={markComplete}
              disabled={marking}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-black text-sm text-white transition-all bg-[#4F7C82] hover:bg-[#3d6068] shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {marking ? 'Saving...' : 'Mark Complete ✓'}
            </button>
          ) : nextLesson ? (
            <Link
              href={`/learn/${slug}/${nextLesson.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#C89B5A] hover:bg-[#b8893a] shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Next Lesson <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href={`/learn/${slug}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm text-white bg-[#4F7C82] hover:bg-[#3d6068] shadow-md transition-all"
            >
              Finish Category <ArrowLeft size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Ask AI Help — floating button */}
      <Link
        href="/ai-tutor"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#4F7C82] hover:bg-[#3d6068] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 text-xl"
        title="Ask AI Help"
      >
        🐻
      </Link>
    </div>
  )
}