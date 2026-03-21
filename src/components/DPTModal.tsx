'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

type DPTModalProps = {
  isOpen: boolean
  onClose: () => void
}

type Voter = {
  nim: string
  name?: string | null
}

export default function DPTModal({ isOpen, onClose }: DPTModalProps) {
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch data
  useEffect(() => {
    if (!isOpen) return

    const fetchVoters = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) {
          params.append('search', debouncedSearch)
        }
        const res = await fetch(`/api/whitelist/public?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal mengambil data DPT')
        const data = await res.json()
        setVoters(data.voters || [])
      } catch (error) {
        console.error('Error fetching voters:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVoters()
  }, [isOpen, debouncedSearch])

  return (
    <AnimatePresence>
      {isOpen && (
                  <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
                      <motion.div
              className="bg-white dark:bg-neutral-900 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-primary-200 dark:border-neutral-700 shadow-2xl flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-cream-50 dark:bg-neutral-950 border-b border-primary-200 dark:border-neutral-700 p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary-100 dark:bg-secondary-900 rounded-xl">
                    <Users size={24} className="text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Daftar Pemilih Tetap</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total: {voters.length} User</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-primary-100 dark:hover:bg-neutral-800 rounded-full transition flex-shrink-0"
                >
                  <X size={24} className="text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-primary-200 dark:border-neutral-700">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari NIM atau Nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-cream-50 dark:bg-neutral-800 border border-primary-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-secondary-500 transition"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-neutral-600 dark:text-neutral-400">Memuat data...</div>
                </div>
              ) : voters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {search ? 'Tidak ada NIM yang ditemukan' : 'Belum ada data DPT'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {voters.map((item, index) => (
                    <motion.div
                      key={item.nim}
                      className="bg-cream-50 dark:bg-neutral-800 border border-primary-300 dark:border-neutral-600 rounded-xl p-4 hover:border-secondary-400 dark:hover:border-secondary-500 transition"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.01 }}
                    >
                      <div className="text-neutral-900 dark:text-neutral-50 font-mono font-medium">{item.nim}</div>
                      {item.name && (
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{item.name}</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
