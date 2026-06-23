'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Megaphone, Lightbulb, Rocket,
  BookOpen, Bot, ClipboardList, Wrench, User,
  Video, Palette, Mic, PenLine,
  ArrowRight, ChevronRight, Sparkles
} from 'lucide-react'

const courseCategories = [
  { name: 'Content Creation',   slug: 'content-creation',   Icon: Camera,    accent: '#C89B5A' },
  { name: 'Digital Marketing',  slug: 'digital-marketing',  Icon: Megaphone, accent: '#4F7C82' },
  { name: 'Entrepreneurship',   slug: 'entrepreneurship',   Icon: Lightbulb, accent: '#C89B5A' },
  { name: 'Career Development', slug: 'career-development', Icon: Rocket,    accent: '#4F7C82' },
]

const interfaces = [
  { label: 'Learning Hub',  href: '/learn',       Icon: BookOpen,      accent: '#C89B5A', desc: 'Browse your courses' },
  { label: 'AI Guide',      href: '/ai-tutor',    Icon: Bot,           accent: '#4F7C82', desc: 'Ask your AI tutor' },
  { label: 'Assessments',   href: '/assessments', Icon: ClipboardList, accent: '#C89B5A', desc: 'Submit your work' },
  { label: 'Toolkit',       href: '/toolkit',     Icon: Wrench,        accent: '#4F7C82', desc: 'Creative tools' },
  { label: 'My Profile',    href: '/profile',     Icon: User,          accent: '#C89B5A', desc: 'View your progress' },
]

const toolkitItems = [
  { label: 'Video Tools',   Icon: Video,   accent: '#C89B5A', desc: 'Editing & subtitles' },
  { label: 'Design Tools',  Icon: Palette, accent: '#4F7C82', desc: 'Graphics & assets' },
  { label: 'Audio Tools',   Icon: Mic,     accent: '#C89B5A', desc: 'Voice & sound' },
  { label: 'Writing Tools', Icon: PenLine, accent: '#4F7C82', desc: 'Captions & scripts' },
]

export default function DashboardPage() {
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name || data.user?.email || 'Creator'
      setUserName(name.split(' ')[0])
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* Welcome Banner */}
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-10 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-10 text-[#C89B5A]/6 pointer-events-none">
          <Sparkles size={160} />
        </div>
        <p className="text-[#C89B5A] font-bold uppercase tracking-widest text-xs mb-3">Welcome back</p>
        <h1 className="text-4xl font-black text-[#2D2416] tracking-tight mb-3">
          {loading ? 'Loading...' : `Hey, ${userName} 👋`}
        </h1>
        <p className="text-[#8B7355] text-base font-medium mb-7 max-w-md leading-relaxed">
          Pick up where you left off or dive into something new today.
        </p>
        <Link href="/learn" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#4F7C82] text-white text-sm font-black tracking-wide hover:bg-[#3d6068] transition-colors shadow-sm">
          Continue Learning <ArrowRight size={15} />
        </Link>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-[#2D2416] font-black text-sm uppercase tracking-wider mb-5">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {interfaces.map(({ label, href, Icon, accent, desc }) => (
            <Link key={href} href={href} className="no-underline group">
              <div className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl bg-white border border-[#E8E0D0] hover:border-[#C89B5A] hover:shadow-md transition-all text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <span className="text-[#2D2416] font-bold text-xs group-hover:text-[#C89B5A] transition-colors">{label}</span>
                <span className="text-[#8B7355] text-[10px] font-medium leading-tight">{desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Course Paths */}
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 shadow-md">
        <div className="flex justify-between items-center pb-5 border-b border-[#E8E0D0] mb-6">
          <div>
            <h2 className="text-[#2D2416] font-black text-base flex items-center gap-2">
              <BookOpen size={18} className="text-[#C89B5A]" /> Course Paths
            </h2>
            <p className="text-[#8B7355] text-xs font-medium mt-1">Choose a track and continue your progress</p>
          </div>
          <Link href="/learn" className="text-[#4F7C82] text-xs font-black uppercase tracking-wider hover:text-[#C89B5A] transition-colors flex items-center gap-1 flex-shrink-0">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseCategories.map(({ name, slug, Icon, accent }) => (
            <Link key={slug} href="/learn" className="no-underline group">
              <div className="border border-[#E8E0D0] rounded-xl p-7 flex flex-col gap-4 hover:border-[#C89B5A] hover:shadow-md transition-all relative overflow-hidden bg-[#FDFCFA]">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: accent }} />
                <Icon size={26} style={{ color: accent }} className="mt-1" />
                <p className="text-[#2D2416] font-black text-sm leading-snug">{name}</p>
                <div className="h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div className="h-full w-0 rounded-full" style={{ background: accent }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider transition-colors" style={{ color: accent }}>
                  Start Track →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Tutor + Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/ai-tutor" className="no-underline group">
          <div className="rounded-2xl p-8 h-full flex flex-col justify-between transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #4F7C82 0%, #3d6068 100%)' }}>
            <div>
              <span className="text-4xl mb-4 block">🐻</span>
              <h3 className="text-white font-black text-base mb-2">Bearilly AI Tutor</h3>
              <p className="text-white/75 text-sm font-medium leading-relaxed mb-6">
                Your personal AI tutor is always ready. Ask anything about your lessons, get feedback, or work through a concept you&apos;re stuck on.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-black text-white group-hover:gap-3 transition-all">
              Start a Conversation <ArrowRight size={14} />
            </span>
          </div>
        </Link>

        <Link href="/assessments" className="no-underline group">
          <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 h-full hover:border-[#C89B5A]/60 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <ClipboardList size={30} className="mb-4 text-[#C89B5A]" />
              <h3 className="text-[#2D2416] font-black text-base mb-2">Assessments</h3>
              <p className="text-[#8B7355] text-sm font-medium leading-relaxed mb-6">
                Submit your completed assignments and track feedback from your instructors all in one place.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-black text-[#C89B5A] group-hover:text-[#4F7C82] group-hover:gap-3 transition-all">
              View Submissions <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>

      {/* Creator Toolkit */}
      <div className="bg-white border border-[#E8E0D0] rounded-2xl p-8 shadow-md">
        <div className="flex justify-between items-center pb-5 border-b border-[#E8E0D0] mb-6">
          <div>
            <h2 className="text-[#2D2416] font-black text-base flex items-center gap-2">
              <Wrench size={18} className="text-[#4F7C82]" /> Creator Toolkit
            </h2>
            <p className="text-[#8B7355] text-xs font-medium mt-1">Free tools to power your creative workflow</p>
          </div>
          <Link href="/toolkit" className="text-[#4F7C82] text-xs font-black uppercase tracking-wider hover:text-[#C89B5A] transition-colors flex items-center gap-1 flex-shrink-0">
            Explore All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {toolkitItems.map(({ label, Icon, accent, desc }) => (
            <Link key={label} href="/toolkit" className="no-underline group">
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#F8F5EF] border border-[#E8E0D0] hover:border-[#C89B5A] hover:bg-white transition-all text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-[#E8E0D0]">
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-[#2D2416] font-bold text-xs mb-0.5 group-hover:text-[#C89B5A] transition-colors">{label}</p>
                  <p className="text-[#8B7355] text-[10px] font-medium">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile Strip */}
      <Link href="/profile" className="no-underline block group">
        <div className="bg-white border border-[#E8E0D0] rounded-2xl p-7 flex items-center justify-between hover:border-[#C89B5A] hover:shadow-md transition-all">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-12 h-12 bg-[#F8F5EF] border border-[#E8E0D0] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <User size={20} className="text-[#C89B5A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[#2D2416] font-black text-sm mb-1">My Profile</p>
              <p className="text-[#8B7355] text-xs font-medium">View your completed courses and manage your credentials.</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-[#E8E0D0] group-hover:text-[#C89B5A] transition-colors flex-shrink-0 ml-4" />
        </div>
      </Link>

    </div>
  )
}