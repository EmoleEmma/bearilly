import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { reference, email, schoolId } = await request.json()

    if (!reference || !email || !schoolId) {
      return NextResponse.json(
        { error: 'Missing reference, email, or schoolId' },
        { status: 400 }
      )
    }

    // Verify the transaction directly with Paystack — never trust the
    // client-side callback alone, since it can be spoofed.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )
    const verifyData = await verifyRes.json()

    if (
      !verifyRes.ok ||
      verifyData?.data?.status !== 'success' ||
      verifyData?.data?.customer?.email?.toLowerCase() !== email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Payment could not be verified.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Confirm the school exists and is active before activating access to it
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, is_active')
      .eq('id', schoolId)
      .eq('is_active', true)
      .maybeSingle()

    if (schoolError || !school) {
      return NextResponse.json(
        { error: 'Selected track is no longer available.' },
        { status: 400 }
      )
    }

    // Activate the profile and attach the paid school
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_activated: true,
        payment_status: 'paid',
        school_id: schoolId,
      })
      .eq('email', email)

    if (updateError) {
      console.error('Profile activation error:', updateError)
      return NextResponse.json(
        { error: 'Payment verified but activating your account failed. Contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json(
      { error: 'Something went wrong verifying payment.' },
      { status: 500 }
    )
  }
}