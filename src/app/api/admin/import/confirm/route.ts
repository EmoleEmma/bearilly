import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ImportPayload, ImportMode } from '@/lib/import/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { schoolId?: string; payload?: ImportPayload; mode?: ImportMode }
  if (!body.schoolId || !body.payload) {
    return NextResponse.json({ error: 'Missing schoolId or payload.' }, { status: 400 })
  }

  // The database function re-checks admin status and applies everything in ONE
  // transaction: either all of it is saved, or none of it is (see Part 2 SQL).
  const { data, error } = await supabase.rpc('import_track_content', {
    p_school_id: body.schoolId,
    p_payload: body.payload,
    p_mode: body.mode === 'append' ? 'append' : 'replace',
  })

  if (error) {
    // Postgres messages from the function (e.g. "Topic ... was not found") are safe to show as-is.
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ result: data })
}
