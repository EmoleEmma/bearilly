'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created! You can now sign in.')
    }
    if (searchParams.get('activated') === 'true') {
      setSuccess('Account activated! You can now sign in.')
    }
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setForm(prev => ({ ...prev, email: emailParam }))
    }
  }, [searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleLogin() {
    if (!form.email || !form.password) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    const freshClient = createClient()
    const { data: profile } = await freshClient
      .from('profiles')
      .select('is_activated')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile && !profile.is_activated) {
      await supabase.auth.signOut()
      setError('Your account is not yet activated. Please register again to complete payment.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') await handleLogin()
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[#EEF1F4] p-8 md:p-10 w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#1E293B] tracking-tight mb-2">Welcome Back</h2>
        <p className="text-sm font-medium text-[#8B7355]">Sign in to your learning workspace.</p>
      </div>

      {success && (
        <div className="mb-5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-4 py-3 rounded-xl shadow-sm">
          {success}
        </div>
      )}

      <div className="space-y-5" onKeyDown={handleKeyDown}>
        <Input
          label="Email Address" name="email" type="email"
          placeholder="you@email.com" value={form.email}
          onChange={handleChange} required
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-bold text-admin-slate/80 tracking-wide">
              Password
            </label>
            <Link href="#" className="text-xs font-bold text-user-gold hover:text-[#B3874B] transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-11 text-sm border border-[#EEF1F4] rounded-xl bg-[#FAF7F2] text-admin-deep placeholder-admin-slate/40 focus:outline-none focus:ring-2 focus:ring-admin-teal focus:bg-white transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-slate/40 hover:text-admin-teal transition-colors"
            >
              {showPassword ? (
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
        </div>

        {error && (
          <p className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-4 py-2.5 rounded-xl shadow-sm">
            {error}
          </p>
        )}

        <div className="pt-2">
          <Button fullWidth size="lg" loading={loading} onClick={handleLogin} className="!rounded-full shadow-lg py-3.5 font-bold tracking-wide bg-[#4F7C82] hover:bg-[#C89B5A] transition-all duration-200">
            Sign In
          </Button>
        </div>
      </div>


      <p className="text-center text-sm font-semibold text-admin-slate/70 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-user-gold font-bold hover:text-[#B3874B] hover:underline transition-colors ml-0.5">
          Register
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}