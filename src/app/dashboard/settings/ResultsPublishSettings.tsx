"use client"

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

type PublishStatus = {
  resultsPublished: boolean
  resultsPublishedAt: string | null
  totalVotes: number
  candidatesCount: number
}

export default function ResultsPublishSettings() {
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [actionType, setActionType] = useState<'publish' | 'unpublish'>('publish')

  const loadStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/results?realtime=1&includeHidden=1', { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal mengambil status publikasi.')
      const json = await res.json()
      setStatus({
        resultsPublished: json.election.resultsPublished || false,
        resultsPublishedAt: json.election.resultsPublishedAt || null,
        totalVotes: json.totals.totalVotes || 0,
        candidatesCount: json.candidates?.length || 0,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const handlePublish = async () => {
    setActionType('publish')
    setShowPasswordModal(true)
  }

  const handleUnpublish = async () => {
    setActionType('unpublish')
    setShowPasswordModal(true)
  }

  const executeAction = async () => {
    if (!password.trim()) {
      setError('Password tidak boleh kosong')
      return
    }

    setPublishing(true)
    setError(null)
    setSuccess(null)
    
    try {
      const method = actionType === 'publish' ? 'POST' : 'DELETE'
      const res = await fetch('/api/results/publish', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Gagal ${actionType === 'publish' ? 'mempublikasikan' : 'membatalkan publikasi'} hasil.`)
      }
      
      if (actionType === 'publish') {
        const data = await res.json()
        setSuccess(`Hasil berhasil dipublikasikan! Total ${data.totalVotes} suara dari ${data.candidatesCount} kandidat.`)
      } else {
        setSuccess('Publikasi hasil berhasil dibatalkan.')
      }
      
      setShowPasswordModal(false)
      setPassword('')
      await loadStatus()
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setPublishing(false)
    }
  }

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
        <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Update Hasil Pemilihan</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Update suara hasil pemilihan. Snapshot akan dibuat dari data real-time saat ini.
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Memuat status...</div>
      ) : (
        <>
          {status?.resultsPublished ? (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    ✓ Hasil Sudah Dipublikasikan
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">
                    Snapshot dipublikasikan pada:{' '}
                    <span className="font-semibold">
                      {status.resultsPublishedAt
                        ? new Date(status.resultsPublishedAt).toLocaleString('id-ID', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })
                        : '-'}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                    Dashboard menampilkan snapshot hasil. Data real-time masih berjalan di background.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                <span className="font-semibold">Status:</span> Hasil belum dipublikasikan
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Landing page menampilkan data real-time. Publikasikan untuk membuat snapshot.
              </div>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4">
            <div className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
              <span className="font-semibold">Data Real-time Saat Ini:</span>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-400">
              • Total Suara: <span className="font-semibold">{status?.totalVotes || 0}</span>
              <br />
              • Jumlah Kandidat: <span className="font-semibold">{status?.candidatesCount || 0}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {publishing ? 'Memproses...' : status?.resultsPublished ? 'Perbarui Snapshot' : 'Publikasikan Hasil'}
            </button>
            {status?.resultsPublished && (
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batalkan Snapshot
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>💡 <span className="font-semibold">Tips:</span></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Perbarui snapshot untuk membuat snapshot baru</li>
              <li>Snapshot tidak akan berubah meskipun ada suara baru masuk</li>
              <li>Perbarui snapshot kapan saja untuk menampilkan data terbaru</li>
              <li>Batalkan snapshot untuk kembali ke mode real-time</li>
            </ul>
          </div>
        </>
      )}

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
                  {actionType === 'publish' ? 'Update Hasil' : 'Batalkan Snapshot'}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Masukkan password untuk konfirmasi</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Password Sistem
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') executeAction()
                  if (e.key === 'Escape') {
                    setShowPasswordModal(false)
                    setPassword('')
                    setError(null)
                  }
                }}
                placeholder="Masukkan password"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPassword('')
                  setError(null)
                }}
                disabled={publishing}
                className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeAction}
                disabled={publishing || !password.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {publishing ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
