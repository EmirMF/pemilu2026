"use client"

import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'

export type ResultCard = {
  id: string
  name: string
  photo: string | null
  voteCount: number
  percentage: number
  isBlank: boolean
  isWinner: boolean
}

type Props = {
  published: boolean
  publishedAt: string | null
  cards: ResultCard[]
  totalVotes: number
  totalDPT: number
  loading?: boolean
}

function CardView({ card, totalVotes }: { card: ResultCard; totalVotes: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-100 dark:border-neutral-700">
      <div className="p-5 sm:p-6 text-center">
        <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 ring-4 ring-neutral-100 dark:ring-neutral-700 shadow-sm">
          {card.photo ? (
            <img src={card.photo} alt={card.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-400">No Photo</div>
          )}
        </div>

        <div className="mb-1 text-lg font-extrabold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
          {card.isBlank ? 'Kotak Kosong' : card.name}
        </div>
        <div className="mb-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {card.isBlank ? 'Suara kosong' : 'Kandidat'}
        </div>

        <div className="text-5xl font-black leading-none text-neutral-900 dark:text-neutral-50 sm:text-6xl">
          {card.percentage.toFixed(2)}%
        </div>
        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
          dari {totalVotes.toLocaleString('id-ID')} suara
        </div>

        <div className="mt-5 rounded-xl bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-center border border-neutral-100 dark:border-neutral-700">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Total Suara</div>
          <div className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {card.voteCount.toLocaleString('id-ID')}
          </div>
        </div>

        {card.isWinner && (
          <div className="mt-4 inline-flex rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            PEMENANG
          </div>
        )}
      </div>
    </div>
  )
}

export default function HasilPemilihanClient({ published, publishedAt, cards, totalVotes, totalDPT, loading = false }: Props) {
  const router = useRouter()

  return (
    <main className="relative z-10 min-h-screen bg-transparent pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100">Hasil Pemilihan</h1>
            {publishedAt && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                Dipublikasikan: {new Date(publishedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            )}
          </div>

          <button
            onClick={() => router.refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-500/20 transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>

        {published ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total Suara</div>
                <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{totalVotes.toLocaleString('id-ID')}</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Jumlah Kandidat</div>
                <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{cards.filter((c) => !c.isBlank).length}</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-sm border border-neutral-100 dark:border-neutral-700">
                <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total DPT</div>
                <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{totalDPT.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cards.map((card) => (
                <CardView key={card.id} card={card} totalVotes={totalVotes} />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-8 text-center shadow-sm border border-neutral-100 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
            Hasil belum dipublikasikan.
          </div>
        )}
      </div>
    </main>
  )
}
