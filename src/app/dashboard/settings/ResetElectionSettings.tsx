"use client"

import { useState } from 'react'
import { RefreshCw, Lock, AlertTriangle } from 'lucide-react'

type ResetType = 'voters' | 'votes' | 'results' | 'all'

export default function ResetElectionSettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedReset, setSelectedReset] = useState<ResetType>('all')
  const [password, setPassword] = useState('')

  const handleReset = async () => {
    if (!password.trim()) {
      setError('Password tidak boleh kosong')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, resetType: selectedReset }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mereset data.')
      }

      const data = await res.json()
      setSuccess(`Reset berhasil! ${data.message}`)
      setShowModal(false)
      setPassword('')
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const resetOptions: { value: ResetType; label: string; desc: string }[] = [
    { value: 'voters', label: 'Reset Status Pemilih', desc: 'Hanya mereset status voted semua pemilih (mengaktifkan kembali voting)' },
    { value: 'votes', label: 'Reset Suara', desc: 'Menghapus semua record suara (kandidat tetap ada)' },
    { value: 'results', label: 'Reset Snapshot', desc: 'Membatalkan snapshot' },
    { value: 'all', label: 'Reset Penuh (Semua)', desc: 'Menghapus semua voters voted, suara, dan snapshot' },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl p-3 text-sm">
          {success}
        </div>
      )}

      <div>
        <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Reset Pemilihan</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Reset data pemilihan. Gunakan dengan hati-hati karena data yang dihapus tidak dapat dikembalikan.
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Reset Data Pemilihan
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                  Reset Data Pemilihan
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Pilih tipe reset:
              </label>
              {resetOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReset === opt.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="resetType"
                    value={opt.value}
                    checked={selectedReset === opt.value}
                    onChange={(e) => setSelectedReset(e.target.value as ResetType)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{opt.label}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                <Lock size={14} className="inline mr-1" />
                Password Sistem
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReset()
                  if (e.key === 'Escape') {
                    setShowModal(false)
                    setPassword('')
                    setError(null)
                  }
                }}
                placeholder="Masukkan password"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  setShowModal(false)
                  setPassword('')
                  setError(null)
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleReset}
                disabled={loading || !password.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Reset Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
