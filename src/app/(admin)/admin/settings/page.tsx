'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Settings as SettingsIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AppSettings = {
  id: string
  payment_enabled: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('id, payment_enabled')
      .limit(1)
      .maybeSingle()
    setSettings(data as AppSettings)
    setLoading(false)
  }

  async function togglePayment() {
    if (!settings) return
    const next = !settings.payment_enabled
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('app_settings')
      .update({ payment_enabled: next, updated_at: new Date().toISOString() })
      .eq('id', settings.id)

    if (!error) {
      setSettings({ ...settings, payment_enabled: next })
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-admin-deep flex items-center gap-2">
          <SettingsIcon size={22} /> Platform Settings
        </h1>
        <p className="text-sm text-admin-slate/60 mt-1">
          Global switches that affect the whole platform.
        </p>
      </div>

      {loading ? (
        <div className="h-24 bg-white rounded-xl animate-pulse" />
      ) : !settings ? (
        <div className="text-center py-16 bg-white rounded-xl text-sm font-semibold text-admin-slate/50">
          Settings row not found. Run the app_settings migration in Supabase.
        </div>
      ) : (
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="p-3 rounded-xl bg-admin-teal/10 text-admin-teal shrink-0 w-fit">
            <CreditCard size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-admin-deep">Payment Tab</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  settings.payment_enabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {settings.payment_enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-sm text-admin-slate/60 mt-1">
              When disabled, the direct payment flow is hidden from users. Nothing is deleted —
              turn it back on any time. Useful while promoting Bearilly through affiliates.
            </p>
          </div>
          <button
            onClick={togglePayment}
            disabled={saving}
            role="switch"
            aria-checked={settings.payment_enabled}
            className={`relative shrink-0 w-14 h-8 rounded-full transition-colors duration-200 disabled:opacity-60 ${
              settings.payment_enabled ? 'bg-admin-teal' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                settings.payment_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  )
}
