import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fullName, email, password, track } = await request.json()

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

    // email_confirm: true — account is created already verified.
    // No confirmation email is sent, no verification step is required.
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
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('is_activated, email')
          .eq('email', email)
          .maybeSingle()

        if (existingProfile && !existingProfile.is_activated) {
          return NextResponse.json(
            {
              error:
                'You already started registration but have not completed payment yet. Please proceed to payment to activate your account.',
              redirectTo: '/payment',
              email,
            },
            { status: 409 }
          )
        }

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

    // Insert profile row — this is the footprint the activate/payment route uses
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
    }

    // No email verification step. Return success with the track (if any)
    // so the frontend can redirect straight to payment.
    return NextResponse.json({ success: true, track: track || null })
  } catch (err) {
    console.log('Register error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}