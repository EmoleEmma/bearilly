'use client'

import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminStatStrip from '@/components/dashboard/AdminStatStrip'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  is_activated: boolean
  payment_status: string
  created_at: string
  school_id: string | null
}

type Track = {
  id: string
  name: string
  slug: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [trackFilter, setTrackFilter] = useState<string>('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const [{ data: userData }, { data: trackData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, is_activated, payment_status, created_at, school_id')
        .order('created_at', { ascending: false }),
      supabase
        .from('schools')
        .select('id, name, slug')
        .order('order_index'),
    ])

    setUsers(userData || [])
    setTracks((trackData || []) as Track[])
    setLoading(false)
  }

  async function toggleActivation(user: User) {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ is_activated: !user.is_activated })
      .eq('id', user.id)
    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, is_activated: !u.is_activated } : u))
    )
  }

  function trackName(schoolId: string | null) {
    if (!schoolId) return null
    return tracks.find(t => t.id === schoolId)?.name || 'Unknown track'
  }

  const filtered = users
    .filter(
      u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(u => trackFilter === 'all' || u.school_id === trackFilter)

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>View and manage platform users.</p>
      </div>

      <AdminStatStrip stats={[
        { label: 'Total Users', value: users.length },
        { label: 'Activated', value: users.filter(u => u.is_activated).length },
      ]} />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1"
            style={{ background: '#334155', border: '1px solid #475569', color: '#fff' }}
          />
        </div>

        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-1 sm:w-56"
          style={{ background: '#334155', border: '1px solid #475569', color: '#fff' }}
        >
          <option value="all">All tracks</option>
          {tracks.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
          <option value="">No track / unpaid</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: '#94A3B8' }}>Loading users...</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2DD4BF' }}>
                  {['#', 'Name', 'Email', 'Track', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: '#0F172A' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center" style={{ color: '#94A3B8' }}>
                    <Users size={28} className="mx-auto mb-2 opacity-40" /><p>No users found.</p>
                  </td></tr>
                ) : filtered.map((user, idx) => (
                  <tr key={user.id}
                    style={{ background: idx % 2 === 0 ? 'transparent' : '#0F172A33', borderBottom: '1px solid #33415540' }}
                    className="transition-colors hover:brightness-110">
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748B' }}>{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{user.full_name || 'No name'}</td>
                    <td className="px-4 py-3" style={{ color: '#94A3B8' }}>{user.email}</td>
                    <td className="px-4 py-3">
                      {trackName(user.school_id) ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: '#1E3A5F', color: '#7DD3FC' }}>
                          {trackName(user.school_id)}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: '#64748B' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: user.role === 'admin' ? '#164E63' : '#1E293B', color: user.role === 'admin' ? '#2DD4BF' : '#94A3B8' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: user.is_activated ? '#064E3B' : '#450A0A', color: user.is_activated ? '#34D399' : '#F87171' }}>
                        {user.is_activated ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#64748B' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActivation(user)}
                        className="px-3 py-1.5 text-sm rounded-lg font-semibold border transition-colors whitespace-nowrap"
                        style={ user.is_activated
                          ? { borderColor: '#EF4444', color: '#EF4444', background: 'transparent' }
                          : { borderColor: '#34D399', color: '#34D399', background: 'transparent' }}>
                        {user.is_activated ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
