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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-sm text-gray-500 mb-6">Sign in to your Bearilly account</p>

      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-4" onKeyDown={handleKeyDown}>
        <Input
          label="Email Address" name="email" type="email"
          placeholder="you@email.com" value={form.email}
          onChange={handleChange} required
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
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
              className="w-full px-3 py-2.5 pr-11 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
      {error}
      </p>
      )}

        <Button fullWidth size="lg" loading={loading} onClick={handleLogin}>
          Sign In
        </Button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500 text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}