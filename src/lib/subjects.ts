'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, Megaphone, Lightbulb, Rocket, Briefcase, Zap, Monitor, DollarSign, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Same icon names the admin's Subjects & Topics tab writes (see the Part 1 migration seed
// and SubjectsTopicsTab.tsx). Any icon name not in this list falls back to BookOpen, so a
// new subject the admin creates never breaks the page — it just shows a generic icon.
const ICONS: Record<string, LucideIcon> = {
  camera: Camera, megaphone: Megaphone, lightbulb: Lightbulb, rocket: Rocket,
  briefcase: Briefcase, zap: Zap, monitor: Monitor, 'dollar-sign': DollarSign, 'book-open': BookOpen,
}

export type SubjectInfo = {
  id: string
  slug: string
  name: string
  description: string | null
  Icon: LucideIcon
  accent: string
}

/**
 * Loads one subject by its URL slug. Replaces the old hard-coded `categoryMap`
 * that was copy-pasted into learn/page.tsx, learn/[slug]/page.tsx and
 * learn/[slug]/test/page.tsx — a new subject the admin creates now appears on
 * these pages automatically, with no code change.
 */
export function useSubject(slug: string | undefined) {
  const [subject, setSubject] = useState<SubjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      setNotFound(false)
      const supabase = createClient()
      const { data } = await supabase
        .from('subjects')
        .select('id, slug, name, description, icon, accent')
        .eq('slug', slug)
        .maybeSingle()
      if (cancelled) return
      if (!data) { setNotFound(true); setSubject(null); setLoading(false); return }
      setSubject({
        id: data.id, slug: data.slug, name: data.name, description: data.description,
        Icon: ICONS[data.icon] ?? BookOpen, accent: data.accent,
      })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  return { subject, loading, notFound }
}

/** All subjects for a track, in order — used by the Learn index page. */
export function useSubjects(schoolId: string | undefined) {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) { setLoading(false); return }
    let cancelled = false
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('subjects')
        .select('id, slug, name, description, icon, accent')
        .eq('school_id', schoolId)
        .order('order_index')
      if (cancelled) return
      setSubjects((data ?? []).map(d => ({
        id: d.id, slug: d.slug, name: d.name, description: d.description,
        Icon: ICONS[d.icon] ?? BookOpen, accent: d.accent,
      })))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [schoolId])

  return { subjects, loading }
}
