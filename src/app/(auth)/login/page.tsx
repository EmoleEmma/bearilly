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
        <Input
          label="Password" name="password" type="password"
          placeholder="Your password" value={form.password}
          onChange={handleChange} required
        />

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