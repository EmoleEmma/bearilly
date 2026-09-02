'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Users, BarChart3, ClipboardList, FolderOpen, LayoutDashboard, Trophy, Menu, X, Layers, FilePlus2, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

type AdminItem = {
  label: string
  href: string
  icon: LucideIcon
}

const adminNav: AdminItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Tracks', href: '/admin/tracks', icon: Layers },
  { label: 'Manage Content', href: '/admin/content', icon: FilePlus2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Quiz Management', href: '/admin/quizzes', icon: Trophy },
  { label: 'Assessments', href: '/admin/assessments', icon: ClipboardList },
  { label: 'Submissions', href: '/admin/submissions', icon: FolderOpen },
  { label: 'Stakecut Claims', href: '/admin/claims', icon: Inbox },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF1F4' }}>
      {/* Admin Header */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b gap-2" style={{ backgroundColor: '#334155', borderColor: '#1E293B' }}>
      {/* Ensure child text inside header is updated to look crisp on slate dark background */}
      <div className="flex items-center gap-3 min-w-0">
      <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-600 transition-colors shrink-0" aria-label="Open menu"><Menu size={20} /></button>
      <div className="min-w-0">
      <h1 className="font-bold text-lg text-white truncate">Bearilly Admin</h1>
      <p className="text-gray-300 text-xs truncate hidden sm:block">Platform Management</p>
      </div>
      </div>
      <Link href="/dashboard" className="text-gray-300 hover:text-white text-xs sm:text-sm transition-colors shrink-0 whitespace-nowrap">
      <span className="hidden sm:inline">← Back to Platform</span>
      <span className="sm:hidden">← Back</span>
      </Link>
      </header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
        {/* Admin Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-56 p-3 border-r z-40 transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:min-h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
        <div className="flex justify-end mb-2 md:hidden"><button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"><X size={18} /></button></div>
          <nav className="space-y-1">
            {adminNav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                        ? 'text-white shadow-sm'
                        : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
                  )}
                style={active ? { backgroundColor: '#4F7C82' } : {}}  
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