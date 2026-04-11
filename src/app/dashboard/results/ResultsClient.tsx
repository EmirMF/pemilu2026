"use client"

import { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw, Table, TrendingUp } from 'lucide-react'

type ResultCandidate = {
  id: string
  name: string
  photo: string | null
  isHidden: boolean
  voteCount: number
  percentage: number
}

type VoteRecordRow = {
  id: string
  createdAt: string
  candidateId: string
  candidateName: string
}

type ResultsResponse = {
  election: { isOpen: boolean; updatedAt: string; lastVoteAt: string | null }
  totals: { totalVotes: number; totalDPT: number; totalVoted: number; turnoutPct: number }
  candidates: ResultCandidate[]
  records: VoteRecordRow[] | null
  pagination: { take: number; skip: number } | null
}

interface StatisticsData {
  summary: {
    totalDPT: number;
    totalVoted: number;
    totalNotVoted: number;
    turnoutRate: number;
  };
  votingTimeline: Array<{ time: string; count: number }>;
  peakHours: Array<{ time: string; count: number }>;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function BarChart({ candidates }: { candidates: ResultCandidate[] }) {
  const maxVotes = Math.max(1, ...candidates.map((c) => c.voteCount))

  return (
    <div className="space-y-4">
      {candidates.map((c, idx) => {
        const widthPct = (c.voteCount / maxVotes) * 100
        return (
          <div key={c.id}>
            <div className="flex items-end justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs">
                    {idx + 1}
                  </span>
                  {c.name}
                  {c.isHidden && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      Tersembunyi
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">{c.voteCount} suara</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{c.percentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ResultsClient() {
  const [data, setData] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)

  const [showRecords, setShowRecords] = useState(false)
  const [recordsSkip, setRecordsSkip] = useState(0)
  const recordsTake = 50

  const exportUrl = useMemo(() => '/api/results/export', [])

  const fetchResults = async (opts?: { includeRecords?: boolean; skip?: number }) => {
    const includeRecords = opts?.includeRecords ?? false
    const skip = opts?.skip ?? 0

    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (includeRecords) {
        qs.set('includeRecords', '1')
        qs.set('take', String(recordsTake))
        qs.set('skip', String(skip))
      }
      qs.set('includeHidden', '1')
      qs.set('realtime', '1')
      const res = await fetch(`/api/results${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal mengambil data hasil.')
      const json = (await res.json()) as ResultsResponse
      setData(json)
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const result = await response.json();
      setStatistics(result);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }

  useEffect(() => {
    void fetchResults({ includeRecords: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showStatistics && !statistics) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStatistics])

  useEffect(() => {
    setRecordsSkip(0)
    if (showRecords) void fetchResults({ includeRecords: true, skip: 0 })
    else void fetchResults({ includeRecords: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecords])

  const sortedCandidates = useMemo(() => {
    if (!data) return []
    return [...data.candidates].sort((a, b) => b.voteCount - a.voteCount)
  }, [data])

  return (
      <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Hasil Pemilihan</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Rekap suara dari hasil snapshot.</p>
          {data?.election.lastVoteAt && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Update terakhir: {new Date(data.election.lastVoteAt).toLocaleString('id-ID', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={exportUrl}
            className="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 px-4 py-2 rounded-xl font-medium shadow-sm"
          >
            <Download size={18} /> Export CSV
          </a>
          <button
            onClick={() => fetchResults({ includeRecords: showRecords, skip: recordsSkip })}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm shadow-red-500/20"
            disabled={loading}
          >
            <RefreshCcw size={18} /> {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total Suara Masuk</div>
          <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{data?.totals.totalVotes ?? (loading ? '…' : 0)}</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Partisipasi</div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {data ? `${data.totals.totalVoted}/${data.totals.totalDPT}` : loading ? '…' : '0/0'}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {data ? `${data.totals.turnoutPct.toFixed(1)}% turnout` : ''}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Status Pemilihan</div>
          <div className="mt-2">
            {data ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  data.election.isOpen ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {data.election.isOpen ? 'Sedang Berlangsung' : 'Ditutup'}
              </span>
            ) : (
              <span className="text-neutral-400 dark:text-neutral-500">{loading ? '…' : '-'}</span>
            )}
          </div>
          {data?.election.updatedAt && (
            <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">Update: {formatDateTime(data.election.updatedAt)}</div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Perolehan Suara per Kandidat</h3>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 select-none">
              <input
                type="checkbox"
                checked={showStatistics}
                onChange={(e) => setShowStatistics(e.target.checked)}
                className="accent-orange-500"
              />
              <TrendingUp size={16} />
              Tampilkan statistik
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 select-none">
              <input
                type="checkbox"
                checked={showRecords}
                onChange={(e) => setShowRecords(e.target.checked)}
                className="accent-red-500"
              />
              Tampilkan vote records
            </label>
          </div>
        </div>

        {data && data.candidates.length === 0 ? (
          <div className="text-neutral-500 dark:text-neutral-400">Belum ada kandidat.</div>
        ) : (
          <BarChart candidates={sortedCandidates} />
        )}
      </div>

      {showRecords && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 inline-flex items-center gap-2">
              <Table size={18} /> Vote Records (Terbaru)
            </h3>
            <button
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
              onClick={async () => {
                const nextSkip = recordsSkip + recordsTake
                setRecordsSkip(nextSkip)
                await fetchResults({ includeRecords: true, skip: nextSkip })
              }}
              disabled={loading}
            >
              Halaman berikutnya
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-700">
                  <th className="py-3 pr-4 font-semibold">Waktu</th>
                  <th className="py-3 pr-4 font-semibold">Kandidat</th>
                  <th className="py-3 pr-4 font-semibold">Record ID</th>
                </tr>
              </thead>
              <tbody>
                {(data?.records ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-neutral-50 dark:border-neutral-700">
                    <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td className="py-3 pr-4 text-neutral-900 dark:text-neutral-100 font-medium">{r.candidateName}</td>
                    <td className="py-3 pr-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs">{r.id}</td>
                  </tr>
                ))}
                {data && (data.records?.length ?? 0) === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                      Belum ada vote record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStatistics && statistics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voting Timeline */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4">Timeline Voting</h3>
              <div className="space-y-2">
                {statistics.votingTimeline.map((item, index) => {
                  const maxVotes = Math.max(...statistics.votingTimeline.map(d => d.count), 1);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 w-32">
                        {new Date(item.time).toLocaleString('id-ID', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-6 relative">
                        <div
                          className="bg-orange-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(item.count / maxVotes) * 100}%` }}
                        >
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4">Jam Puncak (Top 5)</h3>
              <div className="space-y-3">
                {statistics.peakHours.map((peak, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 dark:from-orange-900/30 to-white dark:to-neutral-800 rounded-lg border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-orange-500">#{index + 1}</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{peak.time}</span>
                    </div>
                    <span className="text-orange-600 font-bold text-lg">{peak.count} votes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Turnout Visualization */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4">Visualisasi Turnout</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 flex items-center justify-center text-white font-bold"
                    style={{ width: `${statistics.summary.turnoutRate}%` }}
                  >
                    {statistics.summary.turnoutRate > 10 && `${statistics.summary.turnoutRate}%`}
                  </div>
                  <div
                    className="bg-red-500 flex items-center justify-center text-white font-bold"
                    style={{ width: `${100 - statistics.summary.turnoutRate}%` }}
                  >
                    {100 - statistics.summary.turnoutRate > 10 && `${(100 - statistics.summary.turnoutRate).toFixed(1)}%`}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-green-600 font-medium">Sudah Vote: {statistics.summary.totalVoted}</span>
                  <span className="text-red-600 font-medium">Belum Vote: {statistics.summary.totalNotVoted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

