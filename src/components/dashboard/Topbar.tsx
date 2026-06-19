'use client'

import { Menu, Bell } from 'lucide-react'
import { useState } from 'react'

type TopbarProps = {
  onMenuClick: () => void
  title?: string
}

export default function Topbar({ onMenuClick, title }: TopbarProps) {
  const [hasNotification] = useState(true)

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
      {/* Mobile hamburger menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Bearilly logo text — shown on mobile when sidebar is closed */}
      <span className="font-bold text-[#1E3A5F] text-lg lg:hidden">
        Bearilly
      </span>

      {/* Page title — shown on desktop */}
      {title && (
        <h2 className="font-semibold text-gray-900 text-sm hidden lg:block">
          {title}
        </h2>
      )}

      {/* Spacer */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {hasNotification && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  )
}