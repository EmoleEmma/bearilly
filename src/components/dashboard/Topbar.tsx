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
    <header className="sticky top-0 z-30 bg-[#FAF7F2] border-b border-[#E8E0D0] px-6 py-3.5 flex items-center gap-4 shadow-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-[#F0E8D8] text-[#8B7355] hover:text-[#2D2416] transition-colors border border-transparent hover:border-[#E8E0D0]"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <span className="font-black text-[#2D2416] text-xl lg:hidden tracking-tight flex items-center gap-1">
        <span className="w-2 h-4 bg-[#C89B5A] rounded-sm block"></span>
        Bearilly
      </span>

      {title && (
        <h2 className="font-extrabold text-[#2D2416] text-base hidden lg:block tracking-tight">
          {title}
        </h2>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative p-2 rounded-xl hover:bg-[#F0E8D8] text-[#8B7355] hover:text-[#2D2416] transition-colors border border-transparent hover:border-[#E8E0D0]"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {hasNotification && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  )
}