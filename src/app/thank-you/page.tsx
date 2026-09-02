'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Mail } from 'lucide-react'

function ThankYouContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTrack = searchParams.get('track') || ''

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !fullName.trim()) {
      setError('Please fill in your name and the email you paid with.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/thank-you/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          track: preselectedTrack || undefined,
        }),
      })
      const data = await res.json()
      setSubmitting(false)

      if (data.error) {
        setError(data.error)
        return
      }

      // Send them straight onward to create their account. If they
      // already have one, register will tell them to sign in instead.
      const dest = preselectedTrack
        ? `/register?track=${encodeURIComponent(preselectedTrack)}&email=${encodeURIComponent(email.trim())}`
        : `/register?email=${encodeURIComponent(email.trim())}`
      router.push(dest)
    } catch {
      setSubmitting(false)
      setError('Something went wrong. Please try again or contact support.')
    }
  }

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#C89B5A]/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-[#C89B5A]" />
        </div>
        <h1 className="text-2xl font-black text-[#1E293B] mb-2">Thank you for your purchase!</h1>
        <p className="text-sm font-medium text-[#8B7355] leading-relaxed">
          One last step — tell us your name and the email you paid with, then create your account.
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#C89B5A] text-white text-sm font-bold py-3 rounded-full shadow-md hover:bg-[#4F7C82] transition-all duration-200 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Continue to Registration'}
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
