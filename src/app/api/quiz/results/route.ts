import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')

    // Helper: normalise a row so attempt_number is always present
    function normalise(row: Record<string, unknown>, index: number) {
      return {
        ...row,
        attempt_number: (row.attempt_number as number | null) ?? index + 1,
      }
    }

    if (scope === 'all' && isAdmin) {
      const adminClient = createAdminClient()

      // Try with attempt_number first
      let rows: Record<string, unknown>[] = []
      const full = await adminClient
        .from('quiz_results')
        .select(`id, category, score, total, passed, attempt_number, taken_at, user_id, profiles:user_id (full_name, email)`)
        .order('taken_at', { ascending: false })

      if (full.error?.code === '42703' || full.error?.code === 'PGRST204') {
        // Column missing — fetch without it
        const fallback = await adminClient
          .from('quiz_results')
          .select(`id, category, score, total, passed, taken_at, user_id, profiles:user_id (full_name, email)`)
          .order('taken_at', { ascending: false })
        rows = (fallback.data || []) as Record<string, unknown>[]
      } else if (full.error) {
        console.error('Admin quiz results error:', full.error)
        return NextResponse.json({ error: full.error.message }, { status: 500 })
      } else {
        rows = (full.data || []) as Record<string, unknown>[]
      }

      return NextResponse.json({ results: rows.map(normalise) })
    }

    // Regular user
    const full = await supabase
      .from('quiz_results')
      .select('id, category, score, total, passed, attempt_number, taken_at')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false })

    let rows: Record<string, unknown>[] = []

    if (full.error?.code === '42703' || full.error?.code === 'PGRST204') {
      const fallback = await supabase
        .from('quiz_results')
        .select('id, category, score, total, passed, taken_at')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
      if (fallback.error) {
        console.error('User quiz results error:', fallback.error)
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }
      rows = (fallback.data || []) as Record<string, unknown>[]
    } else if (full.error) {
      console.error('User quiz results error:', full.error)
      return NextResponse.json({ error: full.error.message }, { status: 500 })
    } else {
      rows = (full.data || []) as Record<string, unknown>[]
    }

    return NextResponse.json({ results: rows.map(normalise) })
  } catch (err) {
    console.error('Quiz results route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
