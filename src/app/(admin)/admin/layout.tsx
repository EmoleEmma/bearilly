'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Users, Key, ClipboardList, FolderOpen, LayoutDashboard } from 'lucide-react'

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Access Codes', href: '/admin/codes', icon: Key },
  { label: 'Assessments', href: '/admin/assessments', icon: ClipboardList },
  { label: 'Submissions', href: '/admin/submissions', icon: FolderOpen },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">Bearilly Admin</h1>
          <p className="text-blue-200 text-xs">Platform Management</p>
        </div>
        <Link href="/dashboard" className="text-blue-200 hover:text-white text-sm transition-colors">
          ← Back to Platform
        </Link>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-56 min-h-screen bg-white border-r border-border p-3">
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
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}