'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

type AuthLoginSettingsData = {
  microsoftLoginEnabled: boolean
}

export default function AuthLoginSettings() {
  const [microsoftLoginEnabled, setMicrosoftLoginEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings/election', { cache: 'no-store' })
        if (!res.ok) return

        const data = (await res.json()) as AuthLoginSettingsData
        setMicrosoftLoginEnabled(data.microsoftLoginEnabled ?? true)
      } catch (err) {
        console.error('Failed to fetch auth login settings:', err)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ microsoftLoginEnabled }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(
          microsoftLoginEnabled
            ? 'Microsoft login diaktifkan. Login utama tetap Microsoft.'
            : 'Microsoft login dinonaktifkan. Login utama beralih ke OTP.'
        )
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Gagal menyimpan pengaturan login')
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <ShieldCheck className="text-blue-600 dark:text-blue-300" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Autentikasi Login</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Atur apakah login Microsoft masih aktif. Jika dimatikan, login utama akan memakai OTP.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Memuat pengaturan...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Login Microsoft</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {microsoftLoginEnabled
                  ? 'Aktif. Microsoft tetap menjadi login utama.'
                  : 'Nonaktif. Login utama berpindah ke OTP.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={microsoftLoginEnabled}
                onChange={(e) => setMicrosoftLoginEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">Dampak pengaturan</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Jika Microsoft dimatikan, tombol SSO akan disembunyikan dari halaman login.</li>
              <li>Halaman login akan memprioritaskan OTP sebagai metode utama.</li>
              <li>Route SSO langsung juga akan ditolak saat login Microsoft dinonaktifkan.</li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Login'}
          </button>
        </div>
      )}
    </div>
  )
}