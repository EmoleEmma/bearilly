import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadImportContext } from '@/lib/import/context'
import { validateImport } from '@/lib/import/validate'
import { readWorkbook, MAX_FILE_BYTES } from '@/lib/import/xlsx'
import { parsePastedQuestions } from '@/lib/import/paste'
import { parseKind } from '@/lib/import/validate'
import type { RawImport } from '@/lib/import/types'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const contentType = req.headers.get('content-type') || ''
  let schoolId: string
  let mode: 'replace' | 'append' = 'replace'
  let raw: RawImport | null = null
  const readIssues: { level: 'error' | 'warning' | 'info'; sheet: string; row?: number; message: string }[] = []

  if (contentType.includes('multipart/form-data')) {
    // Excel upload
    const form = await req.formData()
    schoolId = String(form.get('schoolId') ?? '')
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 })
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `That file is too large (max ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)}MB).` }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    const result = await readWorkbook(buf)
    raw = result.raw
    readIssues.push(...result.issues)
  } else {
    // Paste from AI: one field, for one topic, added to a Questions-shaped RawImport
    const body = await req.json()
    schoolId = String(body.schoolId ?? '')
    mode = body.mode === 'append' ? 'append' : 'replace'
    const what = String(body.what ?? '')
    const subject = String(body.subject ?? '')
    const topic = String(body.topic ?? '')
    const text = String(body.text ?? '')

    if (!subject || !topic) return NextResponse.json({ error: 'Pick a subject and a topic first.' }, { status: 400 })
    if (!text.trim()) return NextResponse.json({ error: 'Paste some content first.' }, { status: 400 })

    if (what === 'questions') {
      const kind = parseKind(String(body.kind ?? 'practice')) ?? 'practice'
      const parsed = parsePastedQuestions(text)
      raw = {
        subjects: [], topics: [],
        questions: parsed.map(q => ({ ...q, subject, topic, set: kind })),
        sheetsPresent: [],
        labels: { syllabus: 'Syllabus', subjects: 'Subjects', topics: 'Topics', questions: 'Pasted questions' },
      }
      if (parsed.length === 0) readIssues.push({ level: 'error', sheet: 'Pasted questions', message: 'No questions were recognised in the pasted text. Check it matches the expected format.' })
    } else {
      const field = what as 'lesson' | 'key_points' | 'resources' | 'summary' | 'revision'
      raw = {
        subjects: [],
        topics: [{
          row: 1, subject, title: topic, order: '',
          lesson: field === 'lesson' ? text : '',
          keyPoints: field === 'key_points' ? text : '',
          resources: field === 'resources' ? text : '',
          summary: field === 'summary' ? text : '',
          revision: field === 'revision' ? text : '',
          patch: true,
        }],
        questions: [], sheetsPresent: [],
        labels: { syllabus: 'Syllabus', subjects: 'Subjects', topics: 'Pasted content', questions: 'Questions' },
      }
    }
  }

  if (!schoolId) return NextResponse.json({ error: 'No track was specified.' }, { status: 400 })

  if (!raw) return NextResponse.json({ issues: readIssues, errorCount: readIssues.length, warningCount: 0, summary: null })

  const ctx = await loadImportContext(supabase, schoolId, mode)
  const result = validateImport(raw, ctx)
  result.issues = [...readIssues, ...result.issues]
  result.errorCount = result.issues.filter(i => i.level === 'error').length

  return NextResponse.json(result)
}
