'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    PaystackPop: any
  }
}

type School = {
  id: string
  slug: string
  name: string
  description: string | null
  price_kobo: number
  features: string[]
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const schoolSlug = searchParams.get('school') || ''

  const [email, setEmail] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [paymentEnabled, setPaymentEnabled] = useState<boolean | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [schoolLoading, setSchoolLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  // Payment requires a real logged-in session — check it here rather
  // than trusting an email in the URL, which anyone could edit.
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        router.push(`/register${schoolSlug ? `?track=${schoolSlug}` : ''}`)
        return
      }
      setEmail(user.email)
      setAuthChecked(true)
    }
    checkAuth()
  }, [schoolSlug, router])

  // Check whether direct payment is currently enabled platform-wide
  // (toggled from Admin → Settings).
  useEffect(() => {
    async function checkPaymentEnabled() {
      const supabase = createClient()
      const { data } = await supabase
        .from('app_settings')
        .select('payment_enabled')
        .limit(1)
        .maybeSingle()
      setPaymentEnabled(data?.payment_enabled ?? true)
    }
    checkPaymentEnabled()
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (!schoolSlug) { router.push('/browse'); return }
  }, [authChecked, schoolSlug, router])

  useEffect(() => {
    if (!authChecked || !schoolSlug) return
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('schools')
        .select('id, slug, name, description, price_kobo, features')
        .eq('slug', schoolSlug)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        router.push('/browse')
        return
      }
      setSchool(data as School)
      setSchoolLoading(false)
    }
    load()
  }, [authChecked, schoolSlug, router])

  useEffect(() => {
    const existing = document.getElementById('paystack-script')
    if (existing) { setScriptReady(true); return }
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => setScriptReady(true)
    document.body.appendChild(script)
  }, [])

  function handlePay() {
    if (!scriptReady || !window.PaystackPop || !school) {
      alert('Payment system still loading. Please try again.')
      return
    }
    const reference = `BEARILLY_${school.slug.toUpperCase()}_${Date.now()}`
    setLoading(true)
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: school.price_kobo,
      currency: 'NGN',
      ref: reference,
      callback: function(response: any) {
        setLoading(true)
        fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference, email, schoolId: school.id }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              router.push('/login?activated=true&email=' + encodeURIComponent(email))
            } else {
              alert(data.error || 'Something went wrong.')
              setLoading(false)
            }
          })
          .catch(err => {
            console.error(err)
            alert('Network error. Please try again.')
            setLoading(false)
          })
      },
      onClose: function() {
        setLoading(false)
      },
    })
    handler.openIframe()
  }

  if (!authChecked || !schoolSlug) return null

    if (paymentEnabled === false) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-[#C89B5A]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#C89B5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#1E293B] tracking-tight mb-2">Direct payment is temporarily unavailable</h2>
        <p className="text-sm font-medium text-[#8B7355] max-w-sm mx-auto mb-6">
          We&apos;re currently processing payments through our official partner instead. Purchase there,
          then come back and use "Claim Access" with the email you paid with.
        </p>
          <div className="flex flex-col items-center gap-3">
          
           <a href="https://pay.stakecut.com/?p=YOUR_PRODUCT_ID"
            className="inline-block bg-[#C89B5A] text-white text-sm px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#4F7C82] transition-all duration-200"
          >
            Pay via Stakecut
          </a>
          <a href="/thank-you" className="text-xs font-semibold text-[#4F7C82] underline">
            Already paid? Claim your access
          </a>
        </div>
      </div>
    )
  }

  if (schoolLoading || !school) {
    return (
      <div className="text-center py-8 text-admin-slate/60 text-sm font-semibold animate-pulse">
        Loading school details...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-black text-[#1E293B] tracking-tight mb-2">Complete Your Access</h2>
        <p className="text-sm font-medium text-[#8B7355]">
          {school.description || `One payment unlocks the full ${school.name} ecosystem.`}
        </p>
      </div>

      <div className="bg-[#1E293B] rounded-xl p-5 mb-6 space-y-3">
        {(school.features || []).map(item => (
          <div key={item} className="flex items-start gap-3">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-[#4F7C82]/30 flex items-center justify-center text-[#4F7C82] shrink-0">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#CBD5E1]">{item}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F7C82]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          SSL Secured
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F7C82]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Paystack Verified
        </div>
      </div>

      <div className="border border-[#C89B5A]/30 bg-[#F8F5EF] rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-bold text-admin-slate/60 uppercase tracking-wide">{school.name}</p>
          <p className="text-3xl font-black text-admin-teal">{formatNaira(school.price_kobo)}</p>
          <p className="text-xs font-bold text-user-gold mt-0.5">Monthly access tier</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-admin-slate/50 uppercase tracking-wide">Paying as</p>
          <p className="text-sm font-bold text-admin-deep truncate max-w-[150px] mt-1 bg-white border border-[#EEF1F4] px-2.5 py-1 rounded-md shadow-sm">
            {email}
          </p>
        </div>
      </div>

      <div className="pt-1">
        <Button
          fullWidth
          size="lg"
          loading={loading}
          disabled={!scriptReady}
          onClick={handlePay}
          className="!rounded-full shadow-lg py-3.5 font-bold tracking-wide bg-[#C89B5A] hover:bg-[#4F7C82] transition-all duration-200"
        >
          {!scriptReady ? 'Loading payment platform...' : 'Pay with Paystack'}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-admin-slate/60 text-sm font-semibold animate-pulse">Loading payment platform...</div>}>
      <PaymentContent />
    </Suspense>
  )
}