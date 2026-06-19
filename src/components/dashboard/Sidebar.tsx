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
  { label: 'Opportunities', href: '/toolkit', icon: Wrench },
  { label: 'Assessments', href: '/assessments', icon: ClipboardList },
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

  // Get user's first initial for avatar
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
      {/* Mobile overlay — darkens background when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-[#1E3A5F] z-30 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ── Logo & close button ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">
              Bearilly
            </h1>
            <p className="text-blue-300 text-xs mt-0.5">Creator Platform</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors lg:hidden p-1 rounded-md hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon
                  size={18}
                  className={clsx(
                    'transition-colors',
                    active ? 'text-white' : 'text-blue-300 group-hover:text-white'
                  )}
                />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F0A500]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── Divider ── */}
        <div className="border-t border-white/10 mx-3" />

        {/* ── User info & sign out ── */}
        <div className="px-3 py-4 space-y-1">
          {/* User info row */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#F0A500] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                initial
              )}
            </div>
            {/* Name & email */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-3 bg-white/20 rounded animate-pulse w-20 mb-1" />
                  <div className="h-2.5 bg-white/10 rounded animate-pulse w-28" />
                </>
              ) : (
                <>
                  <p className="text-white text-sm font-medium truncate">
                    {displayName}
                  </p>
                  {fullName && (
                    <p className="text-blue-300 text-xs truncate">{email}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200',
              signingOut
                ? 'text-blue-300/50 cursor-not-allowed'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            )}
          >
            {signingOut ? (
              <Loader2 size={16} className="animate-spin" />
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