"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

type AuditLog = {
  id: string
  action: string
  actorNim?: string
  actorEmail?: string
  actorRole?: string
  targetId?: string
  targetType?: string
  details?: any
  ipAddress?: string
  status: string
  errorMsg?: string
  createdAt: string
}

type Stats = {
  totalLogs: number
  successCount: number
  failedCount: number
  blockedCount: number
  actionCounts: Array<{ action: string; count: number }>
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    action: '',
    status: '',
    actorNim: '',
  })
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  useEffect(() => {
    fetchLogs()
  }, [page, filter])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: (page * limit).toString(),
      })
      
      if (filter.action) params.append('action', filter.action)
      if (filter.status) params.append('status', filter.status)
      if (filter.actorNim) params.append('actorNim', filter.actorNim)

      const res = await fetch(`/api/audit?${params}`)
      const data = await res.json()
      
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/audit?stats=true')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
      case 'FAILED': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
      case 'BLOCKED': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
      default: return 'text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audit Trail</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">Total Logs</div>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg shadow">
            <div className="text-sm text-green-600">Success</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.successCount}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg shadow">
            <div className="text-sm text-red-600">Failed</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failedCount}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg shadow">
            <div className="text-sm text-yellow-600">Blocked</div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.blockedCount}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <input
              type="text"
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              placeholder="e.g., VOTE"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg"
            >
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Actor NIM</label>
            <input
              type="text"
              value={filter.actorNim}
              onChange={(e) => setFilter({ ...filter, actorNim: e.target.value })}
              placeholder="e.g., 13521001"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.actorNim && (
                        <div>
                          <div className="font-medium">{log.actorNim}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{log.actorEmail}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">{log.actorRole}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.details && (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">View</summary>
                          <pre className="mt-2 text-xs text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-900 p-2 rounded overflow-auto max-w-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.errorMsg && (
                        <div className="text-red-600 dark:text-red-400 text-xs mt-1">{log.errorMsg}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="text-sm text-neutral-700 dark:text-neutral-300">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
