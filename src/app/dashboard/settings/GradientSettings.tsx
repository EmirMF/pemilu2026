"use client"

import { useEffect, useState } from 'react'

type GradientColors = {
  bgGradientFrom: string
  bgGradientVia: string
  bgGradientTo: string
}

export default function GradientSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bgGradientFrom, setBgGradientFrom] = useState('#FFC300')
  const [bgGradientVia, setBgGradientVia] = useState('#FF8040')
  const [bgGradientTo, setBgGradientTo] = useState('#FFE6B3')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal mengambil pengaturan gradient.')
      const json = await res.json()
      setBgGradientFrom(json.bgGradientFrom || '#FFC300')
      setBgGradientVia(json.bgGradientVia || '#FF8040')
      setBgGradientTo(json.bgGradientTo || '#FFE6B3')
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveGradient = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bgGradientFrom, bgGradientVia, bgGradientTo }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan gradient.')
      await res.json()
      // Reload page to see changes
      window.location.reload()
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const resetGradient = () => {
    setBgGradientFrom('#FFC300')
    setBgGradientVia('#FF8040')
    setBgGradientTo('#FFE6B3')
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

      <div className="mb-4">
        <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Background Gradient</div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Atur warna gradient untuk background halaman (login, vote, tata cara, dll)</div>
      </div>

      {/* Preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Preview</label>
        <div
          className="w-full h-32 rounded-xl border border-neutral-200 dark:border-neutral-700"
          style={{
            background: `linear-gradient(135deg, ${bgGradientFrom} 0%, ${bgGradientVia} 50%, ${bgGradientTo} 100%)`,
          }}
        />
      </div>

      {/* Color Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Warna Awal</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgGradientFrom}
              onChange={(e) => setBgGradientFrom(e.target.value)}
              className="w-16 h-10 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              disabled={saving}
            />
            <input
              type="text"
              value={bgGradientFrom}
              onChange={(e) => setBgGradientFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="#FFC300"
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Warna Tengah</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgGradientVia}
              onChange={(e) => setBgGradientVia(e.target.value)}
              className="w-16 h-10 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              disabled={saving}
            />
            <input
              type="text"
              value={bgGradientVia}
              onChange={(e) => setBgGradientVia(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="#FF8040"
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Warna Akhir</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgGradientTo}
              onChange={(e) => setBgGradientTo(e.target.value)}
              className="w-16 h-10 rounded border border-neutral-200 dark:border-neutral-700 cursor-pointer"
              disabled={saving}
            />
            <input
              type="text"
              value={bgGradientTo}
              onChange={(e) => setBgGradientTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="#FFE6B3"
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={saveGradient}
          disabled={saving || loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Menyimpan...' : 'Simpan Gradient'}
        </button>
        <button
          onClick={resetGradient}
          disabled={saving}
          className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          Reset ke Default
        </button>
      </div>
    </div>
  )
}
