'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

declare global {
  interface Window {
    PaystackPop: any
  }
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    if (!email) router.push('/register')
  }, [email, router])

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
    if (!scriptReady || !window.PaystackPop) {
      alert('Payment system still loading. Please try again.')
      return
    }
    const reference = `BEARILLY_${Date.now()}`
    setLoading(true)
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email,
      amount: 100000,
      currency: 'NGN',
      ref: reference,
      callback: function(response: any) {
        setLoading(true)
        fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: response.reference, email }),
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

  if (!email) return null

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-black text-[#1E293B] tracking-tight mb-2">Complete Your Access</h2>
        <p className="text-sm font-medium text-[#8B7355]">
          One payment unlocks the full Bearilly ecosystem — courses, AI Tutor, assessments & more.
        </p>
      </div>

      {/* Package features */}
      <div className="bg-[#1E293B] rounded-xl p-5 mb-6 space-y-3">
        {[
          '6 comprehensive course categories',
          'Full access to the Creator Toolkit',
          'Unlimited Bearilly AI Tutor conversations',
          'Real assessment grading and project tracking',
        ].map(item => (
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

      {/* Security badges */}
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

      {/* Price row */}
      <div className="border border-[#C89B5A]/30 bg-[#F8F5EF] rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-bold text-admin-slate/60 uppercase tracking-wide">Total payment</p>
          <p className="text-3xl font-black text-admin-teal">₦1,000</p>
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