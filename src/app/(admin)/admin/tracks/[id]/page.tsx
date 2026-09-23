'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Layers, HelpCircle, ClipboardCheck, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/admin/ui'
import OverviewTab from '@/components/admin/OverviewTab'
import SubjectsTopicsTab from '@/components/admin/SubjectsTopicsTab'
import ImportTab from '@/components/admin/ImportTab'
import QuestionsTab from '@/components/admin/QuestionsTab'
import TestsTab from '@/components/admin/TestsTab'

const TABS = [
  { key: 'overview',  label: 'Overview & Syllabus', icon: FileText },
  { key: 'subjects',  label: 'Subjects & Topics',   icon: Layers },
  { key: 'questions', label: 'Questions',           icon: HelpCircle },
  { key: 'tests',     label: 'Tests',               icon: ClipboardCheck },
  { key: 'import',    label: 'Import',              icon: Upload },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function TrackWorkspacePage() {
  const params = useParams()
  const trackId = params.id as string

  const [trackName, setTrackName] = useState('')
  const [subjectNames, setSubjectNames] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('subjects')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadName() {
      const supabase = createClient()
      const [{ data }, { data: subjects }] = await Promise.all([
        supabase.from('schools').select('name').eq('id', trackId).maybeSingle(),
        supabase.from('subjects').select('name').eq('school_id', trackId).order('order_index'),
      ])
      if (!data) { setNotFound(true); return }
      setTrackName(data.name)
      setSubjectNames((subjects ?? []).map(s => s.name))
    }
    loadName()
  }, [trackId])

  if (notFound) {
    return (
      <div>
        <Link href="/admin/tracks" className="text-sm text-admin-muted hover:text-white inline-flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Tracks
        </Link>
        <EmptyState title="Track not found" note="It may have been deleted." />
      </div>
    )
  }

  return (
    <div>
      <Link href="/admin/tracks" className="text-sm text-admin-muted hover:text-white inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Tracks
      </Link>
      <h1 className="text-2xl font-bold text-white mb-5">{trackName || 'Loading…'}</h1>

      <div className="flex gap-1 mb-6 border-b border-admin-border/50 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'border-admin-accent text-white'
                : 'border-transparent text-admin-muted hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab trackId={trackId} />}
      {activeTab === 'subjects' && <SubjectsTopicsTab trackId={trackId} />}
      {activeTab === 'questions' && <QuestionsTab trackId={trackId} />}
      {activeTab === 'tests' && <TestsTab trackId={trackId} />}
      {activeTab === 'import' && <ImportTab trackId={trackId} subjectNames={subjectNames} />}
    </div>
  )
}
