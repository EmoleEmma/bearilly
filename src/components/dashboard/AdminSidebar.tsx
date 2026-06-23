'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BookOpen, ClipboardList, FileText } from 'lucide-react'

const navItems = [
  { label: 'Overview',       href: '/admin',             icon: LayoutDashboard },
  { label: 'Users',          href: '/admin/users',        icon: Users },
  { label: 'Quiz Management',href: '/admin/quizzes',      icon: BookOpen },
  { label: 'Assessments',    href: '/admin/assessments',  icon: ClipboardList },
  { label: 'Submissions',    href: '/admin/submissions',  icon: FileText },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{ width: 240, minWidth: 240, background: '#0F172A' }}
      className="min-h-screen flex flex-col border-r border-slate-800">

      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-800">
        <p className="text-white font-bold text-lg leading-tight">Bearilly Admin</p>
        <p className="text-xs mt-0.5" style={{ color: '#2DD4BF' }}>Platform Management</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg mb-0.5 transition-colors"
              style={{
                background: active ? '#1E293B' : 'transparent',
                borderLeft: active ? '3px solid #2DD4BF' : '3px solid transparent',
                color: active ? '#fff' : '#94A3B8',
              }}>
              <Icon size={17} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-slate-800">
        <Link href="/dashboard" className="text-sm font-medium" style={{ color: '#2DD4BF' }}>
          ← Back to Platform
        </Link>
      </div>
    </aside>
  )
}