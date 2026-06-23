'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Camera, Megaphone, Lightbulb, Rocket, Briefcase, Zap, Monitor, DollarSign, Check } from 'lucide-react'

const categories = [
  { name: 'Content Creation',   slug: 'content-creation',   Icon: Camera,     accent: '#C89B5A' },
  { name: 'Digital Marketing',  slug: 'digital-marketing',  Icon: Megaphone,  accent: '#4F7C82' },
  { name: 'Entrepreneurship',   slug: 'entrepreneurship',   Icon: Lightbulb,  accent: '#C89B5A' },
  { name: 'Career Development', slug: 'career-development', Icon: Rocket,     accent: '#4F7C82' },
  { name: 'Business Skills',    slug: 'business-skills',    Icon: Briefcase,  accent: '#C89B5A' },
  { name: 'Productivity',       slug: 'productivity',       Icon: Zap,        accent: '#4F7C82' },
  { name: 'Technology',         slug: 'technology',         Icon: Monitor,    accent: '#4F7C82' },
  { name: 'Financial Literacy', slug: 'financial-literacy', Icon: DollarSign, accent: '#C89B5A' },
]

type ProgressMap = Record<string, { total: number; completed: number }>

export default function LearnPage() {
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, category')
        .order('order_index')

      const { data: progress } = await supabase
        .from('progress')
        .select('lesson_id, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const completedIds = new Set((progress || []).map(p => p.lesson_id))

      const map: ProgressMap = {}
      for (const cat of categories) {
        const catLessons = (lessons || []).filter(l =>
          l.category.toLowerCase() === cat.name.toLowerCase()
        )
        const completed = catLessons.filter(l => completedIds.has(l.id)).length
        map[cat.slug] = { total: catLessons.length, completed }
      }
      setProgressMap(map)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Structural Header Node */}
      <div className="mb-8 bg-[#1E293B] rounded-2xl px-8 py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 50%, #C89B5A 0%, transparent 60%)' }} />
        <p className="text-[#C89B5A] font-black text-[10px] uppercase tracking-widest mb-2">Learning Hub</p>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Choose Your Learning Path</h1>
        <p className="text-slate-400 text-sm font-medium mb-6 max-w-lg">Complete all lessons in a category to unlock your performance assessment and earn certification.</p>
        <div className="flex max-w-md">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 border-2 border-transparent focus-within:border-[#4F7C82] transition-colors shadow-sm">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8B7355" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search courses..." className="flex-1 text-sm text-[#2D2416] placeholder-[#8B7355] bg-transparent outline-none font-medium" />
          </div>
        </div>
      </div>

      {/* Grid Assembly System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {categories.map(({ name, slug, Icon, accent }) => {
          const prog = progressMap[slug]
          const total = prog?.total ?? 0
          const completed = prog?.completed ?? 0
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0
          const isDone = total > 0 && completed === total

          return (
            <Link key={slug} href={`/learn/${slug}`} className="no-underline group">
              <div
                className="bg-white border rounded-xl p-6 text-center relative overflow-hidden transition-all hover:shadow-lg hover:border-[#C89B5A] flex flex-col justify-between h-52"
                style={{ borderColor: isDone ? '#C89B5A' : '#E8E0D0' }}
              >
                {isDone && (
                  <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#4F7C82] text-white flex items-center gap-0.5">
                    <Check size={10} strokeWidth={3} /> Certified
                  </span>
                )}

                <div className="mt-2">
                  <div className="w-12 h-12 bg-[#F8F5EF] rounded-xl border border-[#E8E0D0] flex items-center justify-center mx-auto mb-3 shadow-xs transition-transform group-hover:scale-105">
                    <Icon size={24} style={{ color: '#4F7C82' }} />
                  </div>
                  <p className="font-black text-sm tracking-tight text-[#2D2416] group-hover:text-[#C89B5A] transition-colors">{name}</p>
                </div>

                <div className="w-full">
                  {!loading && total > 0 && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-[#F8F5EF] rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: '#C89B5A' }}
                        />
                      </div>
                      <p className="text-[#8B7355] font-bold tracking-wide uppercase text-[10px]">{completed} / {total} Targets Verified</p>
                    </div>
                  )}
                  {!loading && total === 0 && (
                    <p className="text-[#8B7355] font-bold uppercase tracking-widest text-[10px] mt-4 py-1 bg-[#F8F5EF] rounded-full">Coming Soon</p>
                  )}
                  {loading && (
                    <div className="h-1.5 bg-[#E8E0D0] rounded-full mt-4 animate-pulse" />
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}