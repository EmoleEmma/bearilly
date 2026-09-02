'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type School = {
  id: string
  slug: string
  name: string
  tagline: string | null
  price_kobo: number
  features: string[]
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function BrowseContent() {
  const router = useRouter()

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('schools')
        .select('id, slug, name, tagline, price_kobo, features')
        .eq('is_active', true)
        .order('order_index')

      if (!error && data) setSchools(data as School[])
      setLoading(false)
    }
    load()
  }, [])

  async function selectSchool(slug: string) {
    // Browsing is public, but choosing a track requires an account.
    // Check the real session — not a URL param — before deciding where to send them.
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Send visitors to the track's own landing page first — it carries
      // the pitch/pricing and links onward to Stakecut and to registration.
      router.push(`/${slug}`)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_activated')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_activated) {
      router.push('/dashboard')
      return
    }

    // Logged in but never completed payment. Direct payment may be
    // disabled — /payment itself shows the "unavailable" state and
    // points them to Stakecut if so.
    router.push(`/payment?school=${slug}`)
  }

  const filtered = schools.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.tagline || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-[#1E293B] tracking-tight mb-2">Choose Your Track</h2>
        <p className="text-sm font-medium text-[#8B7355]">
          Explore the tracks available. Pick one to see pricing and get started.
        </p>
      </div>

      {!loading && schools.length > 6 && (
        <div className="relative mb-5 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]/60" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tracks..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E8E0D0] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7C82]/30"
          />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-[#F8F5EF] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && schools.length === 0 && (
        <div className="text-center py-10 text-sm font-semibold text-admin-slate/60">
          No tracks are available right now. Please check back soon.
        </div>
      )}

      {!loading && schools.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 text-sm font-semibold text-admin-slate/60">
          No tracks match "{search}".
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
        {filtered.map(school => {
          const extraCount = Math.max((school.features || []).length - 2, 0)
          return (
            <button
              key={school.id}
              onClick={() => selectSchool(school.slug)}
              className="text-left bg-white border border-[#E8E0D0] rounded-xl p-4 transition-all hover:shadow-lg hover:border-[#C89B5A] group flex flex-col h-full"
            >
              <div className="flex-1">
                <p className="font-black text-base tracking-tight text-[#2D2416] group-hover:text-[#C89B5A] transition-colors">
                  {school.name}
                </p>
                {school.tagline && (
                  <p className="text-xs font-medium text-[#8B7355] mt-1 line-clamp-2">{school.tagline}</p>
                )}
                <ul className="mt-3 space-y-1">
                  {(school.features || []).slice(0, 2).map(f => (
                    <li key={f} className="text-[11px] font-semibold text-[#4F7C82] flex items-start gap-1.5">
                      <span className="text-[9px] mt-0.5 shrink-0">●</span>
                      <span className="line-clamp-1">{f}</span>
                    </li>
                  ))}
                  {extraCount > 0 && (
                    <li className="text-[11px] font-semibold text-[#8B7355]/70">+{extraCount} more</li>
                  )}
                </ul>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0EAD8]">
                <p className="text-lg font-black text-admin-teal">{formatNaira(school.price_kobo)}</p>
                <p className="text-xs font-bold text-user-gold">Select →</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-admin-slate/60 text-sm font-semibold animate-pulse">Loading tracks...</div>}>
      <BrowseContent />
    </Suspense>
  )
}
