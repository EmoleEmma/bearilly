import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json()

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Create the auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName },
        email_confirm: true,
      })

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already been registered') ||
        authError.message.toLowerCase().includes('already exists')
      ) {
        return NextResponse.json(
          {
            error:
              'An account with this email already exists. Please sign in instead.',
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Insert profile row — this is the footprint the activate route uses
    const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: 'user',
      is_activated: false,
      payment_status: 'unpaid',
    }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) {
      console.log('Profile insert error:', profileError)
      // Don't fail — auth user was created, profile trigger may have already run
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.log('Register error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}