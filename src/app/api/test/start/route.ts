import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const questionSetId = body?.questionSetId
  if (!questionSetId) return NextResponse.json({ error: 'Missing questionSetId.' }, { status: 400 })

  // start_test_attempt() checks the user is an activated member of this test's
  // track and returns questions with NO "answer" field — the answer key never
  // reaches the browser before the test is submitted.
  const { data, error } = await supabase.rpc('start_test_attempt', { p_question_set_id: questionSetId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
