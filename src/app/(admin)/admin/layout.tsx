'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Users, BarChart3, ClipboardList, FolderOpen, LayoutDashboard, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AdminItem = {
  label: string
  href: string
  icon: LucideIcon
}

const adminNav: AdminItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Quiz Management', href: '/admin/quizzes', icon: Trophy },
  { label: 'Assessments', href: '/admin/assessments', icon: ClipboardList },
  { label: 'Submissions', href: '/admin/submissions', icon: FolderOpen },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF1F4' }}>
      {/* Admin Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: '#334155', borderColor: '#1E293B' }}>
      {/* Ensure child text inside header is updated to look crisp on slate dark background */}
      <div>
      <h1 className="font-bold text-lg text-white">Bearilly Admin</h1>
      <p className="text-gray-300 text-xs">Platform Management</p>
      </div>
      <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm transition-colors">
      ← Back to Platform
      </Link>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-56 min-h-screen p-3 border-r" style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
          <nav className="space-y-1">
            {adminNav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}