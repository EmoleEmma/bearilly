// src/app/api/payment/verify/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { reference, email } = await request.json()

    if (!reference || !email) {
      return NextResponse.json({ error: 'Reference and email are required' }, { status: 400 })
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )

    const paystackData = await paystackRes.json()
    console.log('Paystack response:', JSON.stringify(paystackData))

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    if (paystackData.data?.amount < 100000) {
      return NextResponse.json({ error: 'Incorrect payment amount' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const cleanEmail = email.toLowerCase().trim()

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        is_activated: true,
        payment_status: 'paid',
        payment_reference: reference,
      })
      .eq('email', cleanEmail)
      .select('id')

    if (updateError) {
      console.error('Profile activation error:', updateError)
      return NextResponse.json({ error: 'Activation failed' }, { status: 500 })
    }

    if (!updated || updated.length === 0) {
      console.error('No profile found for email:', cleanEmail)
      return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment successful. Redirecting to dashboard...'
    })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}