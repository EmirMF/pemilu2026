"use client"

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import bcrypt from 'bcryptjs'

type VoteButtonState = 'default' | 'before' | 'after' | 'hidden'

const voteButtonStateOptions: Array<{
  key: VoteButtonState
  label: string
  description: string
  requiresPassword: boolean
}> = [
  { key: 'default', label: 'Default', description: 'Mode normal: tombol untuk vote/login vote.', requiresPassword: true },
  { key: 'before', label: 'Before', description: 'Tombol berubah menjadi "Kenali Calonmu".', requiresPassword: false },
  { key: 'after', label: 'After', description: 'Tombol berubah menjadi "Lihat Hasil".', requiresPassword: true },
  { key: 'hidden', label: 'Hidden', description: 'Tombol disembunyikan dari landing page.', requiresPassword: false },
]

type ElectionSettings = {
  isOpen: boolean
  countdownEnd: string | null
  countdownType: string
  updatedAt: string
  showTotalVotes: boolean
  voteButtonState: VoteButtonState
}

export default function ElectionStatusSettings() {
  const [data, setData] = useState<ElectionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdownDate, setCountdownDate] = useState('')
  const [countdownTime, setCountdownTime] = useState('')
  const [countdownType, setCountdownType] = useState<'start' | 'end'>('end')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingVoteButtonState, setPendingVoteButtonState] = useState<VoteButtonState | null>(null)
  const [password, setPassword] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', { cache: 'no-store' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Gagal mengambil status pemilihan.')
      }
      const json = (await res.json()) as ElectionSettings
      setData(json)
      if (json.countdownEnd) {
        const date = new Date(json.countdownEnd)
        setCountdownDate(date.toISOString().split('T')[0])
        setCountdownTime(date.toTimeString().slice(0, 5))
      }
      setCountdownType((json.countdownType as 'start' | 'end') || 'end')
    } catch (e: any) {
      console.error('Error loading election settings:', e)
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const setOpen = async (isOpen: boolean) => {
    if (!data) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan status pemilihan.')
      const json = (await res.json()) as ElectionSettings
      setData(json)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const saveCountdown = async () => {
    if (!countdownDate || !countdownTime) {
      setError('Tanggal dan waktu harus diisi.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const countdownEnd = new Date(`${countdownDate}T${countdownTime}`).toISOString()
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countdownEnd, countdownType }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan countdown.')
      const json = (await res.json()) as ElectionSettings
      setData(json)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const clearCountdown = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countdownEnd: null }),
      })
      if (!res.ok) throw new Error('Gagal menghapus countdown.')
      const json = (await res.json()) as ElectionSettings
      setData(json)
      setCountdownDate('')
      setCountdownTime('')
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const toggleShowTotalVotes = async (show: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showTotalVotes: show }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan.')
      const json = (await res.json()) as ElectionSettings
      setData(json)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleVoteButtonStateClick = (voteButtonState: VoteButtonState) => {
    const option = voteButtonStateOptions.find(o => o.key === voteButtonState)
    if (option?.requiresPassword) {
      setPendingVoteButtonState(voteButtonState)
      setShowPasswordModal(true)
    } else {
      setVoteButtonState(voteButtonState, '')
    }
  }

  const setVoteButtonState = async (voteButtonState: VoteButtonState, password: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteButtonState, password }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Gagal menyimpan state tombol vote.')
      }
      const json = (await res.json()) as ElectionSettings
      setData(json)
      setShowPasswordModal(false)
      setPassword('')
      setPendingVoteButtonState(null)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 text-sm">{error}</div>}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Status Pemilihan</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            {loading ? 'Memuat…' : data?.isOpen ? 'Voting dibuka untuk pemilih.' : 'Voting ditutup (tidak bisa vote).'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            disabled={loading || saving || data?.isOpen === true}
            className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
              data?.isOpen
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            } disabled:opacity-50`}
          >
            Buka
          </button>
          <button
            onClick={() => setOpen(false)}
            disabled={loading || saving || data?.isOpen === false}
            className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
              data && !data.isOpen
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
            } disabled:opacity-50`}
          >
            Tutup
          </button>
        </div>
      </div>

      <div className="text-xs text-neutral-400 dark:text-neutral-500">
        {data?.updatedAt ? `Terakhir diubah: ${new Date(data.updatedAt).toLocaleString('id-ID')}` : ''}
      </div>

      {/* Countdown Settings */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Countdown Pemilihan</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Atur waktu dan tipe countdown untuk ditampilkan di landing page</div>
        </div>

        {data?.countdownEnd && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-4">
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <span className="font-semibold">
                {data.countdownType === 'start' ? 'Countdown Pembukaan' : 'Countdown Penutupan'}
              </span>
              {' '}aktif hingga: <span className="font-semibold">{new Date(data.countdownEnd).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
          </div>
        )}

        {/* Countdown Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Tipe Countdown</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="countdownType"
                value="start"
                checked={countdownType === 'start'}
                onChange={(e) => setCountdownType(e.target.value as 'start' | 'end')}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
                disabled={saving}
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Countdown Pembukaan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="countdownType"
                value="end"
                checked={countdownType === 'end'}
                onChange={(e) => setCountdownType(e.target.value as 'start' | 'end')}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
                disabled={saving}
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">Countdown Penutupan</span>
            </label>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {countdownType === 'start' 
              ? 'Menampilkan hitung mundur menuju pembukaan pemilihan'
              : 'Menampilkan hitung mundur menuju penutupan pemilihan'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Tanggal</label>
            <input
              type="date"
              value={countdownDate}
              onChange={(e) => setCountdownDate(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Waktu</label>
            <input
              type="time"
              value={countdownTime}
              onChange={(e) => setCountdownTime(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveCountdown}
            disabled={saving || !countdownDate || !countdownTime}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Countdown'}
          </button>
          {data?.countdownEnd && (
            <button
              onClick={clearCountdown}
              disabled={saving}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Hapus Countdown
            </button>
          )}
        </div>
      </div>

      {/* Show Total Votes Setting */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Tampilkan Total Suara</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Kontrol apakah badge total suara ditampilkan di landing page</div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            {data?.showTotalVotes ? 'Badge total suara ditampilkan' : 'Badge total suara disembunyikan'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleShowTotalVotes(true)}
              disabled={saving || data?.showTotalVotes === true}
              className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
                data?.showTotalVotes
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800'
                  : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
              } disabled:opacity-50`}
            >
              Tampilkan
            </button>
            <button
              onClick={() => toggleShowTotalVotes(false)}
              disabled={saving || data?.showTotalVotes === false}
              className={`px-4 py-2 rounded-xl text-sm font-medium border shadow-sm ${
                data && !data.showTotalVotes
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                  : 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
              } disabled:opacity-50`}
            >
              Sembunyikan
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
        <div className="mb-4">
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">State Tombol Vote (Landing)</div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Atur perilaku dan teks tombol utama pada hero section landing page</div>
        </div>

        <div className="space-y-2">
          {voteButtonStateOptions.map((option) => {
            const isActive = data?.voteButtonState === option.key
            return (
              <button
                key={option.key}
                onClick={() => handleVoteButtonStateClick(option.key)}
                disabled={saving || isActive}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50/40 dark:hover:bg-red-900/20 text-neutral-800 dark:text-neutral-200'
                } disabled:opacity-60`}
              >
                <div className="text-sm font-semibold flex items-center gap-2">
                  {option.label}
                  {option.requiresPassword && <Lock size={12} />}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{option.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Lock className="text-orange-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                  Konfirmasi Perubahan
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Masukkan password sistem untuk konfirmasi</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Password Sistem
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setVoteButtonState(pendingVoteButtonState!, password)
                  if (e.key === 'Escape') {
                    setShowPasswordModal(false)
                    setPassword('')
                    setPendingVoteButtonState(null)
                  }
                }}
                placeholder="Masukkan password"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPassword('')
                  setPendingVoteButtonState(null)
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => setVoteButtonState(pendingVoteButtonState!, password)}
                disabled={saving || !password.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
