'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const preselectedTrack = searchParams.get('track') || ''

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !fullName.trim()) {
      setError('Please fill in your name and the email you paid with.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('stakecut_claims')
      .insert({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        school_slug: preselectedTrack || null,
        note: note.trim() || null,
      })

    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong submitting your request. Please try again or contact support.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[#4F7C82]/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-[#4F7C82]" />
        </div>
        <h1 className="text-2xl font-black text-[#1E293B] mb-3">Request received</h1>
        <p className="text-sm font-medium text-[#8B7355] mb-6 leading-relaxed">
          We're confirming your purchase now. You'll get access within a few hours — usually much sooner.
          We'll email <span className="font-bold text-[#1E293B]">{email}</span> once your account is activated
          with instructions to log in.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-bold text-[#4F7C82] border-2 border-[#4F7C82] px-6 py-2.5 rounded-full hover:bg-[#4F7C82] hover:text-white transition-all duration-200"
        >
          Back to Bearilly
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#C89B5A]/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-[#C89B5A]" />
        </div>
        <h1 className="text-2xl font-black text-[#1E293B] mb-2">Thank you for your purchase!</h1>
        <p className="text-sm font-medium text-[#8B7355] leading-relaxed">
          One last step — tell us the email you paid with, and we'll activate your Bearilly account.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-[#EEF1F4] p-5 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wide mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-3 py-2.5 rounded-lg border border-[#E8E0D0] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7C82]/30"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wide mb-1.5">
            Email you paid with
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]/50" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E8E0D0] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7C82]/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#8B7355] uppercase tracking-wide mb-1.5">
            Transaction reference <span className="normal-case font-medium text-[#8B7355]/60">(optional, speeds things up)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="From your Stakecut receipt, if you have it"
            className="w-full px-3 py-2.5 rounded-lg border border-[#E8E0D0] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F7C82]/30"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#C89B5A] text-white text-sm font-bold py-3 rounded-full shadow-md hover:bg-[#4F7C82] transition-all duration-200 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Confirm My Purchase'}
        </button>
      </form>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen px-6 py-16">
      <Suspense fallback={<div className="text-center text-sm text-[#8B7355] font-semibold">Loading...</div>}>
        <ThankYouContent />
      </Suspense>
    </div>
  )
}
