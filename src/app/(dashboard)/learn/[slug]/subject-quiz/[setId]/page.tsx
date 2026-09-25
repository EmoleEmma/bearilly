'use client'

import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSubject } from '@/lib/subjects'
import TestRunner from '@/components/student/TestRunner'

export default function SubjectQuizPage() {
  const params = useParams()
  const slug = params.slug as string
  const setId = params.setId as string
  const { subject } = useSubject(slug)

  return (
    <TestRunner
      title={subject ? `${subject.name} Quiz` : 'Subject Quiz'}
      backHref={`/learn/${slug}`}
      backLabel={subject ? `Back to ${subject.name}` : 'Back to lessons'}
      onLoadSet={async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('question_sets')
          .select('id, question_count, time_limit_sec, pass_mark, is_active')
          .eq('id', setId)
          .maybeSingle()
        return data
      }}
    />
  )
}
