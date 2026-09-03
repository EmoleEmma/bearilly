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
                'An account with this email already exists but is not yet activated. Please sign in — if that fails, contact support.',
              redirectTo: '/login',
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

    const normalizedEmail = String(email).trim().toLowerCase()

    // TEMPORARY: activation gate bypassed. Every registration is activated
    // immediately regardless of payment status. Revert by restoring the
    // stakecut_claims lookup below (hasPaid = Boolean(existingClaim)) once
    // the real activation bug is fixed.
    const hasPaid = true

    // Resolve school_id so every profile is attached to a track, not just
    // ones that arrived through a track-specific /thank-you or register URL.
    // Priority: explicit ?track= param on this request, then the school_slug
    // recorded on a matching stakecut_claims row, then null (no track — the
    // account still activates, but /toolkit and other track-scoped pages
    // will show nothing until an admin or the user attaches one manually).
    let schoolId: string | null = null

    let resolvedSlug: string | null = track || null

    if (!resolvedSlug) {
      const { data: claimRow } = await supabase
        .from('stakecut_claims')
        .select('school_slug')
        .eq('email', normalizedEmail)
        .maybeSingle()
      resolvedSlug = claimRow?.school_slug || null
    }

    if (resolvedSlug) {
      const { data: schoolRow, error: schoolLookupError } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', resolvedSlug)
        .maybeSingle()

      if (schoolLookupError) {
        console.error('School lookup error:', schoolLookupError)
      }
      schoolId = schoolRow?.id || null
    }

    // Insert profile row — this is the footprint the activate/payment route uses
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: normalizedEmail,
        role: 'user',
        is_activated: hasPaid,
        payment_status: hasPaid ? 'paid' : 'unpaid',
        school_id: schoolId,
      }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) {
      console.log('Profile insert error:', profileError)
    }

    // No email verification step. Return success with the track (if any)
    // and whether the account is already activated, so the frontend can
    // route accordingly.
    return NextResponse.json({ success: true, track: resolvedSlug, activated: hasPaid })
  } catch (err) {
    console.log('Register error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}