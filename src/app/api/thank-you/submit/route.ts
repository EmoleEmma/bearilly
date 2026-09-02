import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fullName, email, track } = await request.json()

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const supabase = createAdminClient()

    // Record the claim itself. This stays the audit trail / cross-check
    // against Stakecut's own dashboard, independent of anything below.
    const { error: claimError } = await supabase
      .from('stakecut_claims')
      .insert({
        email: normalizedEmail,
        full_name: String(fullName).trim(),
        school_slug: track || null,
      })

    if (claimError) {
      console.error('Claim insert error:', claimError)
      return NextResponse.json(
        { error: 'Something went wrong submitting your request. Please try again or contact support.' },
        { status: 500 }
      )
    }

    // If a profile already exists for this email (they registered before
    // paying), mark payment_status paid now. This does NOT set
    // is_activated — that only happens at registration time, so payment
    // and registration stay decoupled per the current architecture.
    // If no profile exists yet, there's nothing to update — the claim
    // record above is what registration will check against later.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ payment_status: 'paid' })
      .eq('email', normalizedEmail)

    if (updateError) {
      // Non-fatal: the claim was recorded successfully either way.
      console.error('Profile payment_status update error:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Thank-you submit error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
