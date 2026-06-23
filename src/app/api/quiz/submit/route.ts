import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { category, score, total, passed } = body

    if (!category || score === undefined || total === undefined || passed === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Count previous attempts for this user+category
    const { count: prevAttempts } = await supabase
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', category)

    const attempt_number = (prevAttempts || 0) + 1

    // Try inserting with attempt_number first; fall back without it if column missing
    let data: Record<string, unknown> | null = null
    let error: { code?: string; message?: string } | null = null

    const withAttempt = await supabase
      .from('quiz_results')
      .insert({
        user_id: user.id,
        category,
        score,
        total,
        passed,
        attempt_number,
        taken_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (withAttempt.error?.code === '42703' || withAttempt.error?.code === 'PGRST204') {
      // Column doesn't exist yet — insert without it
      const withoutAttempt = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          category,
          score,
          total,
          passed,
          taken_at: new Date().toISOString(),
        })
        .select()
        .single()
      data = withoutAttempt.data as Record<string, unknown> | null
      error = withoutAttempt.error as { code?: string; message?: string } | null
    } else {
      data = withAttempt.data as Record<string, unknown> | null
      error = withAttempt.error as { code?: string; message?: string } | null
    }

    if (error) {
      console.error('Quiz result insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      result: { ...data, attempt_number: (data as Record<string, unknown> | null)?.attempt_number ?? attempt_number },
    })
  } catch (err) {
    console.error('Quiz submit route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
