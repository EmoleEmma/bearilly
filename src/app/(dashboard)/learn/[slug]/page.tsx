'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Camera, Megaphone, Lightbulb, Rocket, Briefcase, Zap, Monitor, DollarSign } from 'lucide-react'
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
  order_index: number
  status?: 'not_started' | 'started' | 'completed'
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const cat = categoryMap[slug]

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)
  const [showGuidance, setShowGuidance] = useState(false)
  const [pendingLesson, setPendingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    if (!cat) { router.push('/learn'); return }
    load()
  }, [slug])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: rawLessons } = await supabase
      .from('lessons')
      .select('id, title, description, order_index')
      .eq('category', cat.name)
      .order('order_index')

    const { data: progress } = await supabase
      .from('progress')
      .select('lesson_id, status')
      .eq('user_id', user.id)

    const progressMap = Object.fromEntries((progress || []).map(p => [p.lesson_id, p.status]))

    const enriched: Lesson[] = (rawLessons || []).map(l => ({
      ...l,
      status: progressMap[l.id] as Lesson['status'] ?? 'not_started',
    }))

    setLessons(enriched)
    setAllDone(enriched.length > 0 && enriched.every(l => l.status === 'completed'))
    setLoading(false)
  }

  function handleLessonClick(lesson: Lesson) {
    if (lesson.status === 'completed') {
      router.push(`/learn/${slug}/${lesson.id}`)
      return
    }
    setPendingLesson(lesson)
    setShowGuidance(true)
  }

  function proceedToLesson() {
    if (pendingLesson) router.push(`/learn/${slug}/${pendingLesson.id}`)
    setShowGuidance(false)
  }

  if (!cat) return null

  const { Icon, accent } = cat
  const completed = lessons.filter(l => l.status === 'completed').length
  const pct = lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">

      {/* Guidance Confirmation Modal Canvas */}
      {showGuidance && pendingLesson && (
        <div className="fixed inset-0 bg-[#1E293B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 max-w-md w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-[#F8F5EF] border border-[#E8E0D0] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon size={24} style={{ color: accent }} />
            </div>
            <h2 className="text-[#2D2416] text-xl font-black tracking-tight mb-2">Before You Begin</h2>
            <p className="text-[#8B7355] text-sm font-medium leading-relaxed mb-6">
              You are about to engage with <strong className="text-slate-800 font-bold">{pendingLesson.title}</strong>. Take your time reviewing each block context thoroughly. Complete all entries inside this category to activate your evaluation test.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowGuidance(false)}
                className="px-5 py-2.5 rounded-full border border-[#E8E0D0] bg-[#F8F5EF] text-[#8B7355] font-bold text-xs uppercase tracking-wider hover:bg-[#E8E0D0] transition-colors"
              >
                Not Yet
              </button>
              <button
                onClick={proceedToLesson}
                className="px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider text-white shadow-sm transition-all hover:opacity-90 bg-[#4F7C82]"
              >
                Start Lesson →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Return Hook */}
      <div className="mb-6">
        <Link href="/learn" className="text-[#8B7355] text-xs font-black uppercase tracking-wider hover:text-[#4F7C82] transition-colors flex items-center gap-1.5">
          <ArrowLeft size={13} /> Back to Learning Hub
        </Link>
      </div>

      {/* Category Banner */}
      <div className="bg-[#1E293B] rounded-2xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 90% 50%, #C89B5A 0%, transparent 60%)' }} />
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#4F7C82] px-3 py-1 rounded-full bg-[#4F7C82]/10 border border-[#4F7C82]/20 mb-3">
              {lessons.length} Lessons
            </span>
            <h1 className="text-white text-2xl font-black tracking-tight mb-1">{cat.name}</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{completed} of {lessons.length} completed</p>
          </div>
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={26} style={{ color: '#C89B5A' }} />
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C89B5A, #E7C997)' }}
          />
        </div>
      </div>

      {/* Performance Audit Activation Banner */}
      {allDone && (
        <div className="bg-white border border-[#C89B5A]/40 rounded-2xl p-6 text-center mb-6 shadow-md animate-in fade-in duration-200">
          <ClipboardList size={32} className="text-[#C89B5A] mx-auto mb-2" />
          <h3 className="text-[#2D2416] font-black text-base tracking-tight mb-1">All Lessons Complete! 🎉</h3>
          <p className="text-[#8B7355] text-xs font-medium mb-4 leading-relaxed">You've finished every lesson in this category. Take the assessment to earn your certification.</p>
          <Link
            href={`/learn/${slug}/test`}
            className="inline-block px-8 py-3 rounded-full font-black text-xs uppercase tracking-wider text-white transition-all shadow-md bg-[#4F7C82] hover:bg-[#3d6068]"
          >
            Take Assessment →
          </Link>
        </div>
      )}

      {/* Segmented Modules Grid Stream */}
      {loading ? (
        <div className="text-center py-12 text-[#8B7355] text-xs font-bold uppercase tracking-wider">Loading lessons…</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E8E0D0] rounded-2xl shadow-sm text-[#8B7355]">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-xs font-black uppercase tracking-wider">No lessons available yet — check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson, i) => {
            const isCompleted = lesson.status === 'completed'
            const isStarted = lesson.status === 'started'
            const label = isCompleted ? 'Review' : isStarted ? 'Continue' : 'Launch'

            return (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className="bg-white rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all border hover:border-[#C89B5A] hover:shadow-md group"
                style={{ borderColor: isCompleted ? 'rgba(79,124,130,0.25)' : '#E8E0D0' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black"
                  style={{
                    background: isCompleted ? '#4F7C82' : isStarted ? '#F8F5EF' : '#FFFFFF',
                    color: isCompleted ? '#FFFFFF' : isStarted ? '#4F7C82' : '#8B7355',
                    border: `1.5px solid ${isCompleted ? '#4F7C82' : isStarted ? '#4F7C82' : '#E8E0D0'}`,
                  }}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[#2D2416] font-black text-sm mb-0.5 group-hover:text-[#C89B5A] transition-colors tracking-tight">{lesson.title}</p>
                  <p className="text-[#8B7355] text-xs font-medium truncate">{lesson.description}</p>
                </div>

                <span
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex-shrink-0 transition-colors border"
                  style={{
                    background: isCompleted ? 'rgba(79,124,130,0.08)' : isStarted ? '#F8F5EF' : '#FFFFFF',
                    borderColor: isCompleted ? 'rgba(79,124,130,0.3)' : isStarted ? 'rgba(79,124,130,0.3)' : '#E8E0D0',
                    color: (isCompleted || isStarted) ? '#4F7C82' : '#8B7355',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}