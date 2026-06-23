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
        <p className="text-sm font-medium text-[#8B7355]">Sign in to your premium creator workspace.</p>
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

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#EEF1F4]"></span></div>
        <span className="relative bg-white px-3 text-xs font-bold text-admin-slate/40 uppercase tracking-wider">Or continue with</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="flex items-center justify-center gap-2 border border-[#E8E0D0] rounded-full py-2.5 text-sm font-bold text-[#334155] hover:bg-[#FAF7F2] hover:border-[#C89B5A]/40 transition-all duration-200 shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>
        <button type="button" className="flex items-center justify-center gap-2 border border-[#E8E0D0] rounded-full py-2.5 text-sm font-bold text-[#334155] hover:bg-[#FAF7F2] hover:border-[#C89B5A]/40 transition-all duration-200 shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Apple
        </button>
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