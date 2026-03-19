"use client"

import { motion } from 'framer-motion'
import { Users, Vote, UserCheck, UserX, TrendingUp, Clock, UserPlus, FileBarChart, Settings, UserSquare2, BarChart3, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type CandidateRow = {
  id: string
  name: string
  voteCount: number
}

type VoterStats = {
  total: number
  voted: number
  notVoted: number
}

export default function DashboardClient({
  candidates,
  totalVotes,
  isOpen,
  voterStats,
  lastUpdate,
}: {
  candidates: CandidateRow[]
  totalVotes: number
  isOpen: boolean
  voterStats: VoterStats
  lastUpdate: string | null
}) {
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount)
  const participationRate = voterStats.total > 0 ? (voterStats.voted / voterStats.total) * 100 : 0
  const [showVotes, setShowVotes] = useState(false)

  const statsCards = [
    {
      title: 'Total Pemilih',
      value: voterStats.total,
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Sudah Memilih',
      value: voterStats.voted,
      icon: UserCheck,
      color: 'bg-green-500',
      lightColor: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Belum Memilih',
      value: voterStats.notVoted,
      icon: UserX,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Total Suara',
      value: totalVotes,
      icon: Vote,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold text-neutral-800 dark:text-neutral-100">Dashboard</h2>
        <p className="text-sm lg:text-base text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Pemilihan General Manager 8EH Radio ITB 2026/2027</p>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 lg:mb-8 p-4 lg:p-5 rounded-2xl ${isOpen ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOpen ? 'bg-green-100 dark:bg-green-900/40' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
              <Clock className={`w-5 h-5 ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Status Pemilihan</p>
              <p className={`font-semibold ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                {isOpen ? 'Sedang Berlangsung' : 'Ditutup'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Tingkat Partisipasi</p>
            <p className="text-lg lg:text-xl font-bold text-neutral-800 dark:text-neutral-100">{participationRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white dark:bg-neutral-900 p-4 lg:p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.lightColor}`}>
                  <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
              <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">{stat.title}</p>
      </motion.div>
      )
      })}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 lg:mb-8">
        <h3 className="text-base lg:text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Link href="/dashboard/voters">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-neutral-900 p-4 lg:p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer group hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-400 transition-colors" />
              </div>
              <p className="font-medium text-neutral-800 dark:text-neutral-100 text-sm lg:text-base">Kelola Pemilih</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Tambah & atur DPT</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/candidates">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-neutral-900 p-4 lg:p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer group hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <UserSquare2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-400 transition-colors" />
              </div>
              <p className="font-medium text-neutral-800 dark:text-neutral-100 text-sm lg:text-base">Kelola Kandidat</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Tambah & atur kandidat</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/results">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-neutral-900 p-4 lg:p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer group hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-400 transition-colors" />
              </div>
              <p className="font-medium text-neutral-800 dark:text-neutral-100 text-sm lg:text-base">Lihat Hasil</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Hasil pemilihan</p>
            </motion.div>
          </Link>

          <Link href="/dashboard/settings">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-neutral-900 p-4 lg:p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 cursor-pointer group hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30">
                  <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-400 transition-colors" />
              </div>
              <p className="font-medium text-neutral-800 dark:text-neutral-100 text-sm lg:text-base">Pengaturan</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Atur pemilihan</p>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white dark:bg-neutral-900 p-4 lg:p-8 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4 lg:mb-6 border-b border-neutral-100 dark:border-neutral-700 pb-3 lg:pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base lg:text-lg font-bold text-neutral-800 dark:text-neutral-100">Perolehan Suara Kandidat</h3>
              {lastUpdate && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Update terakhir: {new Date(lastUpdate).toLocaleString('id-ID', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowVotes(!showVotes)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors text-xs lg:text-sm font-medium text-neutral-700 dark:text-neutral-300 dark:text-neutral-600"
          >
            {showVotes ? (
              <>
                <EyeOff size={14} />
                <span className="hidden sm:inline">Sembunyikan</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span className="hidden sm:inline">Tampilkan</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4 lg:space-y-6">
          {sorted.map((candidate, i) => {
            const percentage = totalVotes === 0 ? 0 : (candidate.voteCount / totalVotes) * 100
            const isLeading = i === 0 && sorted.length > 1
            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-2">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <span className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium flex-shrink-0 ${
                      (isLeading && showVotes) ? 'bg-red-500 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm lg:text-base">{candidate.name}</span>
                    {isLeading && showVotes && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                        Terdepan
                      </span>
                    )}
                  </div>
                  <div className="sm:text-right ml-9 sm:ml-0">
                    {showVotes ? (
                      <>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 text-lg lg:text-xl">{percentage.toFixed(1)}%</span>
                        <span className="text-neutral-400 dark:text-neutral-500 ml-2 text-xs lg:text-sm">({candidate.voteCount} suara)</span>
                      </>
                    ) : (
                      <span className="font-bold text-neutral-400 dark:text-neutral-500 text-lg lg:text-xl blur-sm select-none">••••</span>
                    )}
                  </div>
                </div>

                <div className="h-3 lg:h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ml-9 sm:ml-11 relative">
                  {showVotes ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${isLeading ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-gray-400 to-gray-300'}`}
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-200 blur-sm" />
                  )}
                </div>
              </motion.div>
            )
          })}

          {sorted.length === 0 && (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
              Belum ada kandidat terdaftar.
            </div>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 lg:p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3 text-sm lg:text-base">Ringkasan Pemilihan</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Jumlah Kandidat</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-100">{candidates.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Suara Sah</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-100">{totalVotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Suara Tidak Sah</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-100">0</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 lg:p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700">
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3 text-sm lg:text-base">Statistik Partisipasi</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Total DPT</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-100">{voterStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sudah Menggunakan Hak Pilih</span>
              <span className="font-medium text-green-600">{voterStats.voted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Belum Menggunakan Hak Pilih</span>
              <span className="font-medium text-orange-600">{voterStats.notVoted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
