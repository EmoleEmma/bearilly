import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Params = { trackSlug: string }

const RESERVED_SLUGS = new Set([
  'login', 'register', 'browse', 'payment', 'dashboard', 'admin',
  'api', 'learn', 'ai-tutor', 'assessments', 'toolkit', 'my-quizzes',
  'profile', '_next', 'favicon.ico', 'sell', 'thank-you', 'jv',
])

export default async function TrackLandingPage({ params }: { params: Promise<Params> }) {
  const { trackSlug } = await params

  if (RESERVED_SLUGS.has(trackSlug)) notFound()

  const supabase = await createClient()
  const { data: track } = await supabase
    .from('schools')
    .select('id, slug, name, tagline, description, features')
    .eq('slug', trackSlug)
    .eq('is_active', true)
    .single()

  if (!track) notFound()

  const features = (track.features || []) as string[]

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <span className="text-4xl">🐻</span>
          <p className="text-[#4F7C82] font-black text-lg mt-1">Bearilly</p>
        </div>

        <h1 className="text-3xl font-black text-[#1E293B] tracking-tight mb-2">{track.name}</h1>
        {track.tagline && (
          <p className="text-sm font-medium text-[#8B7355] mb-6">{track.tagline}</p>
        )}

        {features.length > 0 && (
          <ul className="text-left bg-white border border-[#E8E0D0] rounded-xl p-5 mb-6 space-y-2.5">
            {features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm font-semibold text-[#334155]">
                <span className="w-4 h-4 rounded-full bg-[#4F7C82]/15 text-[#4F7C82] flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/register?track=${encodeURIComponent(track.slug)}`}
          className="block w-full py-3 rounded-full font-bold text-white text-sm transition-colors mt-2"
          style={{ backgroundColor: '#4F7C82' }}
        >
          Get Started
        </Link>

        <p className="text-xs text-[#8B7355] mt-3">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline">Sign in</Link>
        </p>
        <p className="text-xs text-[#8B7355] mt-1">
          Looking for something else?{' '}
          <Link href="/sell" className="font-semibold underline">Browse all tracks</Link>
        </p>
      </div>
    </div>
  )
}