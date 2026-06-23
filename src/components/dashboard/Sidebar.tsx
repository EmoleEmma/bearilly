'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  Wrench,
  ClipboardList,
  Trophy,
  LogOut,
  X,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Learn', href: '/learn', icon: BookOpen },
  { label: 'AI Tutor', href: '/ai-tutor', icon: Bot },
  { label: 'Toolkit', href: '/toolkit', icon: Wrench },
  { label: 'Assessments', href: '/assessments', icon: ClipboardList },
  { label: 'My Quizzes', href: '/my-quizzes', icon: Trophy },
]

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const [signingOut, setSigningOut] = useState(false)

  const fullName = user?.user_metadata?.full_name ?? ''
  const email = user?.email ?? ''
  const initial = fullName ? fullName[0].toUpperCase() : email ? email[0].toUpperCase() : 'U'
  const displayName = fullName || email || 'User'

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-admin-deep/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-[#C89B5A] border-r border-[#B8893A] z-30 flex flex-col transition-transform duration-300 shadow-lg',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & close */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#B8893A]/50">
          <div>
            <h1 className="text-white font-black text-xl tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-4 bg-white/80 rounded-sm block"></span>
              Bearilly
            </h1>
            <p className="text-white/70 text-[10px] font-extrabold tracking-wider uppercase mt-0.5">Platform Studio</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors lg:hidden p-1 rounded-xl hover:bg-white/20 border border-transparent hover:border-white/30"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {/* Section label */}
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest px-4 pb-1">
            Main Menu
          </p>

          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative',
                  active
                    ? 'bg-white/25 border border-white/40 text-white shadow-sm'
                    : 'text-white/75 hover:bg-white/15 hover:text-white'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-md"></span>
                )}
                <Icon
                  size={17}
                  className={clsx(
                    'transition-colors flex-shrink-0',
                    active ? 'text-white' : 'text-white/50 group-hover:text-white'
                  )}
                />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Divider + account section */}
        <div className="border-t border-white/20 h-px" />

        <div className="px-3 py-4 space-y-1">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest px-4 pb-1">
            Account
          </p>

          {/* User info */}
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all duration-200 border border-transparent hover:border-white/30 group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/30 border border-white/40 flex items-center justify-center font-extrabold text-white text-sm flex-shrink-0 shadow-inner uppercase">
              {loading ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-3 bg-admin-gray rounded animate-pulse w-16 mb-1" />
                  <div className="h-2 bg-admin-gray/60 rounded animate-pulse w-24" />
                </>
              ) : (
                <>
                  <p className="text-white text-sm font-bold truncate">{displayName}</p>
                  {fullName && (
                    <p className="text-white/60 text-xs font-semibold truncate mt-0.5">{email}</p>
                  )}
                </>
              )}
            </div>
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-bold transition-all duration-200',
              signingOut
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white/70 hover:bg-white/20 hover:text-white border border-transparent hover:border-white/30'
            )}
          >
            {signingOut ? (
              <Loader2 size={16} className="animate-spin text-white/40" />
            ) : (
              <LogOut size={16} />
            )}
            <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}