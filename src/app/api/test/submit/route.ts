import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const questionSetId = body?.questionSetId
  const answers = body?.answers
  const startedAt = body?.startedAt
  if (!questionSetId || !Array.isArray(answers) || !startedAt) {
    return NextResponse.json({ error: 'Missing questionSetId, answers or startedAt.' }, { status: 400 })
  }

  // submit_test_attempt() looks up the correct answer for each question
  // ITSELF, server-side, and computes the score. Nothing the client sends
  // (a claimed score, a claimed "passed" flag) is ever trusted — there is no
  // such parameter for it to send. This is the fix for the score-tampering
  // hole in the old /api/quiz/submit route.
  const { data, error } = await supabase.rpc('submit_test_attempt', {
    p_question_set_id: questionSetId,
    p_answers: answers,
    p_started_at: startedAt,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
