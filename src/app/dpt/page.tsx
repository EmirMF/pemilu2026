'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import GradientBackground from '@/components/GradientBackground'

type DPTItem = {
  nim: string
  name?: string | null
  hasVoted?: boolean
  votedAt?: string | null
}

type DPTResponse = {
  voters?: DPTItem[]
}

export default function DPTPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [voters, setVoters] = useState<DPTItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()

    const fetchDPT = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (debouncedSearch) {
          params.set('search', debouncedSearch)
        }

        const res = await fetch(`/api/whitelist/public?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error('Gagal mengambil data DPT')
        }

        const data = (await res.json()) as DPTResponse
        setVoters(data.voters || [])
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Terjadi kesalahan saat memuat data DPT.')
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchDPT()

    return () => controller.abort()
  }, [debouncedSearch])

  const hasSearch = debouncedSearch.length > 0

  return (
    <>
      <GradientBackground />
      <main className="min-h-screen relative text-neutral-900 dark:text-neutral-50">
        <Navbar />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Kembali ke beranda
            </Link>

            <div className="bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-primary-200 dark:border-neutral-700 rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-6 sm:px-8 py-8 sm:py-10 border-b border-primary-200/70 dark:border-neutral-700 bg-linear-to-r from-secondary-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 text-sm font-medium mb-4">
                      <Users size={16} />
                      Daftar Pemilih Tetap
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                      Cek DPT yang tersedia
                    </h1>
                    <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Lihat dan cari data pemilih yang terdaftar dalam DPT berdasarkan NIM atau nama.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto lg:min-w-96">
                    <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-primary-200 dark:border-neutral-700 px-4 py-4 shadow-sm">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total hasil</div>
                      <div className="text-2xl font-bold">{voters.length}</div>
                    </div>
                    <div className="rounded-2xl bg-white dark:bg-neutral-950 border border-primary-200 dark:border-neutral-700 px-4 py-4 shadow-sm">
                      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Mode pencarian</div>
                      <div className="text-2xl font-bold">{hasSearch ? 'Filter' : 'Semua'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 border-b border-primary-200/70 dark:border-neutral-700">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari NIM atau nama..."
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-950 border border-primary-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20 transition"
                  />
                </div>
                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                  {hasSearch ? `Menampilkan hasil untuk “${debouncedSearch}”.` : 'Gunakan kolom pencarian untuk memfilter daftar DPT.'}
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="animate-pulse rounded-full h-12 w-12 bg-secondary-100 dark:bg-secondary-900 mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-300">Memuat data DPT...</p>
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-red-500" />
                    <p className="font-medium text-red-700 dark:text-red-300 mb-1">Gagal memuat data</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                ) : voters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      {hasSearch ? 'Tidak ada data yang cocok' : 'Belum ada data DPT'}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
                      {hasSearch
                        ? 'Coba gunakan kata kunci lain, misalnya sebagian NIM atau nama.'
                        : 'Daftar DPT belum tersedia untuk ditampilkan.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {voters.map((item, index) => (
                      <motion.div
                        key={item.nim}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group rounded-2xl border border-primary-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-secondary-300 dark:hover:border-secondary-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                              NIM
                            </p>
                            <p className="font-mono font-semibold text-lg text-neutral-900 dark:text-neutral-50 break-all">
                              {item.nim}
                            </p>
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 text-xs font-medium shrink-0">
                            DPT
                          </div>
                        </div>

                        <div className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {item.name || 'Nama tidak tersedia'}
                        </div>

                          <div
                            className={
                              item.hasVoted
                                ? 'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            }
                          >
                            {item.hasVoted ? 'Sudah memilih' : 'Belum memilih'}
                          </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  )
}