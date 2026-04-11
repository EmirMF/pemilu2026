"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'

type ResultCandidate = {
  id: string
  name: string
  major?: string | null
  photo: string | null
  voteCount: number
  percentage: number
}

type ResultsResponse = {
  totals: { totalVotes: number }
  candidates: ResultCandidate[]
}

export default function ResultsSection() {
  const [candidates, setCandidates] = useState<ResultCandidate[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchResults = async () => {
    try {
      const res = await fetch('/api/results', { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as ResultsResponse
      const sorted = [...(json.candidates || [])].sort((a, b) => b.voteCount - a.voteCount)
      setCandidates(sorted)
      setTotalVotes(json.totals.totalVotes || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }
    fetchResults()
  }, [])

  const maxVotes = Math.max(...candidates.map(c => c.voteCount), 1)

  if (loading) {
    return (
      <section id="results" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-neutral-500">Memuat hasil...</p>
        </div>
      </section>
    )
  }

  return (
    <section id="results" className="py-24 px-4 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 mb-2 md:mb-4">
            Hasil Pemilihan
          </h2>
          <p className="text-md md:text-lg text-neutral-600 dark:text-neutral-400">
            Perolehan suara pemilihan General Manager 8EH Radio ITB 2026/2027
          </p>
        </div>

        <div className="grid gap-6">
          {candidates.map((candidate, index) => {
            const barWidth = (candidate.voteCount / maxVotes) * 100
            const rank = index + 1
            
            return (
              <div
                key={candidate.id}
                className="relative bg-white dark:bg-neutral-800 rounded-2xl p-4 md:p-6 shadow-lg border border-neutral-100 dark:border-neutral-700 overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-4 md:gap-6">
                  <div className="hidden md:flex flex-col items-center justify-center w-12 shrink-0">
                    <span className={`text-2xl font-black ${'text-neutral-300'}`}>
                      #{rank}
                    </span>
                  </div>
                  
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden relative shrink-0 bg-neutral-200 dark:bg-neutral-700">
                    {candidate.photo ? (
                      <Image
                        src={candidate.photo}
                        alt={candidate.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <span className="text-2xl font-bold">{candidate.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 md:mb-2">
                      <span className="md:hidden text-lg font-black text-neutral-400">#{rank}</span>
                      <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {candidate.name}
                      </h3>
                      {candidate.major && (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 hidden md:inline">
                          {candidate.major}
                        </span>
                      )}
                    </div>
                    {candidate.major && (
                      <div className="md:hidden text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                        {candidate.major}
                      </div>
                    )}
                    
                    <div className="h-4 md:h-6 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden mb-1 md:mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          'bg-gradient-to-r from-red-600 to-red-700' 
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs md:text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {candidate.voteCount} suara
                      </span>
                      <span className="text-lg md:text-xl font-black text-neutral-900 dark:text-neutral-100">
                        {candidate.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 md:mt-12 p-6 md:p-8 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl md:rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-red-100 text-sm md:text-lg font-medium">Total Suara Masuk</p>
              <p className="text-white text-4xl md:text-5xl font-black">{totalVotes}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-red-100 text-sm md:text-lg font-medium">Partisipasi</p>
              <p className="text-white text-2xl md:text-3xl font-bold">
                {candidates.length > 0 
                  ? ((totalVotes / candidates.reduce((acc, c) => acc + c.voteCount, 0)) * 100 || 0).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
