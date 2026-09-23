'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Users, ClipboardList, LayoutDashboard, Trophy, Menu, X, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AdminItem = {
  label: string
  href: string
  icon: LucideIcon
  // Extra path prefixes that should also light this item up. Lets pages that
  // stay on disk but are out of the sidebar still highlight a sensible parent.
  alsoActiveFor?: string[]
}

// 5 items. Content management now lives INSIDE a track (Tracks -> a track -> tabs),
// so Manage Content, Payment Records and Settings are no longer sidebar items.
// Those pages are still on disk and still reachable by URL; nothing is deleted.
const adminNav: AdminItem[] = [
  { label: 'Overview',    href: '/admin',             icon: LayoutDashboard },
  { label: 'Tracks',      href: '/admin/tracks',      icon: Layers, alsoActiveFor: ['/admin/content'] },
  { label: 'Users',       href: '/admin/users',       icon: Users,  alsoActiveFor: ['/admin/claims'] },
  { label: 'Results',     href: '/admin/quizzes',     icon: Trophy },
  { label: 'Assignments', href: '/admin/assessments', icon: ClipboardList, alsoActiveFor: ['/admin/submissions', '/admin/assignments'] },
]

function isActive(pathname: string, item: AdminItem) {
  // /admin (Overview) must match exactly, otherwise it would be lit on every admin page.
  if (item.href === '/admin') return pathname === '/admin'
  const prefixes = [item.href, ...(item.alsoActiveFor ?? [])]
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text">
      {/* Admin Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b gap-2 bg-admin-surface border-admin-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-white truncate">Bearilly Admin</h1>
            <p className="text-admin-muted text-xs truncate hidden sm:block">Platform Management</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-admin-muted hover:text-white text-xs sm:text-sm transition-colors shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">← Back to Platform</span>
          <span className="sm:hidden">← Back</span>
        </Link>
      </header>

      <div className="flex">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Admin Sidebar */}
        <aside
          className={clsx(
            'fixed top-0 left-0 h-full w-56 p-3 border-r z-40 transition-transform duration-300',
            'md:static md:translate-x-0 md:z-auto md:min-h-screen',
            'bg-admin-surface border-admin-border/60',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex justify-end mb-2 md:hidden">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-admin-muted hover:text-white hover:bg-admin-card transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="space-y-1">
            {adminNav.map(item => {
              const { label, href, icon: Icon } = item
              const active = isActive(pathname, item)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'text-white shadow-sm bg-admin-accent'
                      : 'text-admin-muted hover:bg-admin-card hover:text-white'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}