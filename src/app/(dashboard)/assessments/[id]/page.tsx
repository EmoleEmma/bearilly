'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, Paperclip, CheckCircle, ArrowLeft } from 'lucide-react'

type Assessment = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  status: 'active' | 'closed'
  file_url: string | null
}

type Submission = {
  id: string
  submission_ref: string
  status: 'submitted' | 'under_review' | 'reviewed'
  file_url: string | null
  link_url: string | null
  submitted_at: string
  reviewer_notes: string | null
}

function generateSubmissionRef() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randPart = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `BRLY-${datePart}-${randPart}`
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [assessmentId])

  async function load() {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments').select('*').eq('id', assessmentId).single()

      if (assessmentError || !assessmentData) {
        setError('Selected assignment configuration structure missing.')
        setLoading(false)
        return
      }
      setAssessment(assessmentData)

      const { data: submissionData } = await supabase
        .from('submissions').select('*')
        .eq('assessment_id', assessmentId).eq('user_id', user.id).maybeSingle()

      setSubmission(submissionData)
    } catch (err) {
      console.error('Assessment detail load error:', err)
      setError('System connection failure mapping portfolio parameters.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!linkUrl.trim() && !file) {
      setError('Please provide a remote link target node or upload an artifact asset.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let fileUrl: string | null = null

      if (file) {
        const filePath = `${user.id}/${assessmentId}-${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('submissions').upload(filePath, file)
        if (uploadError) {
          setError('Storage bucket uplink upload interrupted. Retry sequence.')
          setSubmitting(false)
          return
        }
        const { data: urlData } = await supabase.storage.from('submissions').createSignedUrl(filePath, 60 * 60 * 24 * 365)
        fileUrl = urlData?.signedUrl || null
      }

      const { data, error: submitError } = await supabase
        .from('submissions')
        .insert({
          assessment_id: assessmentId,
          user_id: user.id,
          submission_ref: generateSubmissionRef(),
          link_url: linkUrl.trim() || null,
          file_url: fileUrl,
          status: 'submitted',
        })
        .select().single()

      if (submitError) {
        setError('Database registry transmission failed. Re-evaluate link values.')
        setSubmitting(false)
        return
      }
      setSubmission(data)
    } catch (err) {
      console.error('Submit error:', err)
      setError('Unexpected network exception packaging sandbox portfolio output.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto text-center py-20 text-xs font-semibold uppercase tracking-wider text-[#8B7355]">Loading assessment…</div>
  )

  if (error && !assessment) return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
      <Link href="/assessments" className="text-xs font-semibold uppercase tracking-wider text-[#4F7C82] hover:underline">
        ← Back to Assessment Center
      </Link>
    </div>
  )

  if (!assessment) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Link href="/assessments" className="text-xs font-semibold uppercase tracking-wider text-[#8B7355] hover:text-[#4F7C82] mb-5 inline-flex items-center gap-1 transition-colors">
        <ArrowLeft size={12} /> Back to Assessments
      </Link>

      <div className="bg-[#1E293B] rounded-2xl p-6 mb-4 shadow-md">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-extrabold text-white tracking-tight leading-snug">{assessment.title}</h1>
          <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0 ${
            assessment.status === 'active' ? 'bg-[#C89B5A] text-white' : 'bg-red-500/80 text-white'
          }`}>
            {assessment.status === 'active' ? 'Active' : 'Closed'}
          </span>
        </div>

        {assessment.description && (
          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">{assessment.description}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          {assessment.deadline && (
            <p className="text-xs font-semibold text-[#4F7C82] uppercase tracking-wider">
              Deadline: <span className="text-white font-bold">{new Date(assessment.deadline).toLocaleDateString()}</span>
            </p>
          )}
          {assessment.file_url && (
            <a href={assessment.file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C89B5A] hover:underline">
              <FileText className="w-3.5 h-3.5" /> View File ↓
            </a>
          )}
        </div>
      </div>

      {submission ? (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="bg-[#FAF7F2] border border-[#E7C997]/40 rounded-xl p-5 mb-5 text-center">
            <CheckCircle className="w-7 h-7 text-[#C89B5A] mx-auto mb-2" />
            <p className="font-bold text-slate-900 text-sm tracking-tight">Submission Received</p>
            <p className="text-[11px] text-[#8B7355] font-semibold uppercase tracking-wider mt-0.5">Reference Number</p>
            <p className="font-mono text-xs font-bold text-[#C89B5A] mt-2.5 bg-white inline-block px-3 py-1.5 rounded-lg border border-[#E7C997]/40 tracking-wider">
              {submission.submission_ref}
            </p>
          </div>

          <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Submission Details</h2>

          <div className="space-y-2 border-b border-[#E8E0D0] pb-4 mb-4 font-medium text-sm">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#8B7355]">Status</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                submission.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#4F7C82]/10 text-[#4F7C82]'
              }`}>
                {submission.status === 'under_review' ? 'In Audit' : submission.status === 'reviewed' ? 'Completed' : 'In Audit'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#8B7355]">Submitted</span>
              <span className="text-slate-700 font-semibold">{new Date(submission.submitted_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {submission.link_url && (
              <a href={submission.link_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold uppercase tracking-wider text-[#4F7C82] hover:underline flex items-center gap-1">
                View submitted link →
              </a>
            )}
            {submission.file_url && (
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold uppercase tracking-wider text-[#4F7C82] hover:underline flex items-center gap-1">
                View File →
              </a>
            )}
          </div>

          {submission.reviewer_notes && (
            <div className="mt-5 p-4 bg-white rounded-xl border-2 border-[#4F7C82]/30">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4F7C82] mb-1">Admin Feedback</p>
              <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{submission.reviewer_notes}</p>
            </div>
          )}
        </div>
      ) : assessment.status === 'closed' ? (
        <div className="bg-white rounded-2xl p-6 text-center text-[#8B7355] shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider">This assessment is closed and no longer accepting submissions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="font-bold text-slate-900 text-sm tracking-tight mb-0.5">Submit Assessment</h2>
          <p className="text-xs text-[#8B7355] font-medium mb-5">Provide a link to your work or upload a file directly.</p>

          <div className="space-y-4">
            <input
              type="url"
              placeholder="Paste project URL (e.g., Notion, Figma, Drive)..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-lg bg-[#FAF7F2] text-slate-800 placeholder-[#8B7355]/60 font-medium focus:outline-none focus:ring-2 focus:ring-[#4F7C82] transition-all duration-200 ease-in-out"
            />

            <div className="text-center text-[10px] font-semibold text-[#8B7355]/60 uppercase tracking-widest">— OR —</div>

            <label className="block border-2 border-dashed border-[#4F7C82]/40 hover:border-[#4F7C82] bg-[#FAF7F2] rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ease-in-out group">
              <input
                type="file"
                accept=".pdf,.docx,.pptx,image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {file ? (
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4F7C82] flex items-center justify-center gap-1.5">
                  <Paperclip size={13} /> {file.name}
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 group-hover:text-[#C89B5A] transition-colors">Drop a file or click to upload</p>
                  <p className="text-[10px] text-[#8B7355] font-medium mt-1">PDF, DOCX, PPTX, image, or video</p>
                </>
              )}
            </label>

            {error && (
              <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#C89B5A] hover:bg-[#C89B5A]/90 disabled:opacity-40 transition-all duration-200 ease-in-out shadow-md text-center flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}