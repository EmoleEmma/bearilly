'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Requirement = { label: string; met: boolean }

function getRequirements(value: string): Requirement[] {
  return [
    { label: 'At least 8 characters', met: value.length >= 8 },
    { label: 'One uppercase letter',  met: /[A-Z]/.test(value) },
    { label: 'One number',            met: /[0-9]/.test(value) },
  ]
}

function getStrength(reqs: Requirement[]) {
  const count = reqs.filter(r => r.met).length
  if (count === 0) return { label: '',       color: 'transparent', width: '0%' }
  if (count === 1) return { label: 'Weak',   color: '#E24B4A',     width: '33%' }
  if (count === 2) return { label: 'Fair',   color: '#EF9F27',     width: '66%' }
  return              { label: 'Strong', color: '#34D399',     width: '100%' }
}

function PasswordInput({
  value,
  onChange,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [show, setShow] = useState(false)
  const requirements = getRequirements(value)
  const strength = getStrength(requirements)
  const allMet = requirements.every(r => r.met)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="password" className="text-sm font-bold text-admin-slate/80 tracking-wide">
        Password
      </label>

      <div className="relative">
        <input
          id="password"
          name="password"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="Create a password"
          required
          autoComplete="new-password"
          className="w-full px-4 py-3 pr-11 text-sm border border-[#EEF1F4] rounded-xl bg-[#FAF7F2] text-admin-deep placeholder-admin-slate/40 focus:outline-none focus:ring-2 focus:ring-admin-teal focus:bg-white transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-slate/40 hover:text-admin-teal transition-colors"
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-1">
          <div className="h-1.5 bg-[#EEF1F4] rounded-full overflow-hidden mb-1">
            <div
              style={{
                width: strength.width,
                background: strength.color,
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
              className="h-full rounded-full"
            />
          </div>
          {strength.label && (
            <p className="text-xs font-bold" style={{ color: strength.color }}>
              {strength.label}
            </p>
          )}
        </div>
      )}

      {value.length > 0 && !allMet && (
        <ul className="flex flex-col gap-1 mt-1 p-0 list-none">
          {requirements.map(req => (
            <li
              key={req.label}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: req.met ? '#10B981' : '#64748B' }}
            >
              <span className="text-[11px]">{req.met ? '✓' : '○'}</span>
              {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setRedirectTo('')
  }

  async function handleRegister() {
    if (!form.fullName || !form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    const reqs = getRequirements(form.password)
    if (!reqs.every(r => r.met)) {
      setError('Password must be at least 8 characters, include an uppercase letter and a number.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        if (data.redirectTo) setRedirectTo(data.redirectTo)
      } else {
        router.push(`/payment?email=${encodeURIComponent(form.email)}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') await handleRegister()
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="mb-6">
        <h2 className="text-3xl font-black text-[#1E293B] tracking-tight mb-1">Join 2,000+ Creators</h2>
        <p className="text-sm font-medium text-[#8B7355]">
          Register first, then complete payment to unlock full access.
        </p>
      </div>

      <div className="space-y-4">
        <Input label="Full Name" name="fullName" placeholder="Username" value={form.fullName} onChange={handleChange} required />
        <Input label="Email Address" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
        <PasswordInput value={form.password} onChange={handleChange} />

        {error && (
          <div className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-4 py-2.5 rounded-xl shadow-sm">
            {error}
            {redirectTo && (
              <>
                {' '}
                <Link href={`${redirectTo}?email=${encodeURIComponent(form.email)}`} className="font-bold text-user-gold hover:text-[#B3874B] underline ml-1">
                  Go to Payment →
                </Link>
              </>
            )}
          </div>
        )}

        <div className="pt-1">
          <Button fullWidth size="lg" loading={loading} onClick={handleRegister} className="!rounded-full shadow-lg py-3.5 font-bold tracking-wide bg-[#C89B5A] hover:bg-[#4F7C82] transition-all duration-200">
            Create Account & Proceed to Payment
          </Button>
        </div>
      </div>

      <p className="text-center text-sm font-semibold text-admin-slate/70 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-user-gold font-bold hover:text-[#B3874B] hover:underline transition-colors ml-0.5">
          Sign in
        </Link>
      </p>
    </div>
  )
}