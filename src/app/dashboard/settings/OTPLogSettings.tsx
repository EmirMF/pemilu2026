"use client"

import { useEffect, useState } from 'react'

export default function OTPLogSettings() {
  const [otpLogEnabled, setOtpLogEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal mengambil pengaturan.')
      const json = await res.json()
      setOtpLogEnabled(json.otpLogEnabled ?? false)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const toggleOtpLog = async (enabled: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpLogEnabled: enabled }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan.')
      const json = await res.json()
      setOtpLogEnabled(json.otpLogEnabled ?? false)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 text-sm">{error}</div>}

      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">OTP Logging</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {loading ? 'Memuat…' : otpLogEnabled ? 'OTP disimpan ke database untuk fallback admin' : 'OTP tidak disimpan ke database'}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Aktifkan jika layanan email tidak stabil. Admin bisa melihat OTP di dashboard.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleOtpLog(true)}
            disabled={loading || saving || otpLogEnabled === true}
            className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
              otpLogEnabled
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            } disabled:opacity-50`}
          >
            Aktif
          </button>
          <button
            onClick={() => toggleOtpLog(false)}
            disabled={loading || saving || otpLogEnabled === false}
            className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
              !otpLogEnabled
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            } disabled:opacity-50`}
          >
            Nonaktif
          </button>
        </div>
      </div>
    </div>
  )
}
