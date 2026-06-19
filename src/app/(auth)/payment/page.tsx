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
        console.log('Payment successful')
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
      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Complete Your Payment
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Monthly access. Cancel anytime.
      </p>

      <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm">
          What you get with Bearilly Access:
        </h3>
        {[
          '6 content creation learning categories',
          'AI Tutor for instant answers',
          'Free creator tools directory',
          'Assessment center with real submissions',
          'Progress tracking and completion status',
          'Monthly platform access',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">{item}</span>
          </div>
        ))}
      </div>

      <div className="border border-[#1E3A5F] rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total payment</p>
          <p className="text-3xl font-bold text-[#1E3A5F]">₦1,000</p>
          <p className="text-xs text-gray-400 mt-0.5">Monthly</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Paying as</p>
          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{email}</p>
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        loading={loading}
        onClick={handlePay}
      >
        Pay ₦1,000/month Securely
      </Button>

      <p className="text-center text-xs text-gray-400 mt-4">
        Secured by Paystack. Your card details are never stored.
      </p>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-500 text-sm">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  )
}