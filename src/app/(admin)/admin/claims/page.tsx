'use client'

import { useEffect, useState } from 'react'
import { Inbox, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminStatStrip from '@/components/dashboard/AdminStatStrip'

type Claim = {
  id: string
  email: string
  full_name: string | null
  school_slug: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('stakecut_claims')
      .select('id, email, full_name, school_slug, note, status, created_at')
      .order('created_at', { ascending: false })
    setClaims((data || []) as Claim[])
    setLoading(false)
  }

  async function approveClaim(claim: Claim) {
    setProcessingId(claim.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Find the profile matching this email. If they haven't registered yet,
    // there's nothing to activate — the claim stays pending until they do.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id')
      .eq('email', claim.email)
      .maybeSingle()

    if (!profile) {
      alert(
        `No Bearilly account exists yet for ${claim.email}. Ask the buyer to register first at bearilly.vercel.app/register, then approve this claim again.`
      )
      setProcessingId(null)
      return
    }

    let schoolId = profile.school_id

    // If they don't have a school attached yet and we know which track
    // they intended to buy, attach it now.
    if (!schoolId && claim.school_slug) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', claim.school_slug)
        .maybeSingle()
      if (school) schoolId = school.id
    }

    const { error: activateError } = await supabase
      .from('profiles')
      .update({
        is_activated: true,
        payment_status: 'paid',
        ...(schoolId ? { school_id: schoolId } : {}),
      })
      .eq('id', profile.id)

    if (activateError) {
      alert('Failed to activate the account. Please try again.')
      setProcessingId(null)
      return
    }

    await supabase
      .from('stakecut_claims')
      .update({
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'approved' } : c))
    setProcessingId(null)
  }

  async function rejectClaim(claim: Claim) {
    setProcessingId(claim.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('stakecut_claims')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', claim.id)

    setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'rejected' } : c))
    setProcessingId(null)
  }

  const visibleClaims = filter === 'pending'
    ? claims.filter(c => c.status === 'pending')
    : claims

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-admin-deep flex items-center gap-2">
          <Inbox size={22} /> Stakecut Claims
        </h1>
        <p className="text-sm text-admin-slate/60 mt-1">
          Buyers who paid via Stakecut submit their email here. Cross-check against your{' '}
          <a
            href="https://app.stakecut.com/dashboard/orders"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold inline-flex items-center gap-1"
          >
            Stakecut Order &amp; Sales dashboard <ExternalLink size={12} />
          </a>{' '}
          before approving.
        </p>
      </div>

      <AdminStatStrip stats={[
        { label: 'Pending', value: claims.filter(c => c.status === 'pending').length },
        { label: 'Approved', value: claims.filter(c => c.status === 'approved').length },
        { label: 'Total Claims', value: claims.length },
      ]} />

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilter('pending')}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
            filter === 'pending' ? 'bg-admin-teal text-white' : 'bg-white text-admin-slate/60 border border-gray-200'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
            filter === 'all' ? 'bg-admin-teal text-white' : 'bg-white text-admin-slate/60 border border-gray-200'
          }`}
        >
          All
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && visibleClaims.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          {filter === 'pending' ? 'No pending claims right now.' : 'No claims yet.'}
        </div>
      )}

      <div className="space-y-3">
        {visibleClaims.map(claim => (
          <div key={claim.id} className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-admin-deep truncate">{claim.full_name || 'Unnamed'}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    claim.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : claim.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {claim.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-admin-slate/70 mt-0.5 truncate">{claim.email}</p>
              {claim.school_slug && (
                <p className="text-xs text-admin-slate/50 font-mono mt-0.5">track: {claim.school_slug}</p>
              )}
              {claim.note && (
                <p className="text-xs text-admin-slate/50 mt-1 italic truncate">ref: {claim.note}</p>
              )}
              <p className="text-[11px] text-admin-slate/40 mt-1">
                {new Date(claim.created_at).toLocaleString()}
              </p>
            </div>

            {claim.status === 'pending' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => rejectClaim(claim)}
                  disabled={processingId === claim.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => approveClaim(claim)}
                  disabled={processingId === claim.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#4F7C82' }}
                >
                  <CheckCircle2 size={14} />
                  {processingId === claim.id ? 'Activating...' : 'Approve & Activate'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
