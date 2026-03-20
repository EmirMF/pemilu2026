"use client";

import { useState, useEffect } from "react";
import { Search, Key, Clock, CheckCircle, XCircle, Copy, Check } from "lucide-react";

interface OTPLog {
  id: string;
  email: string;
  nim: string;
  otp: string;
  used: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

export default function OTPLogsClient() {
  const [otpLogs, setOtpLogs] = useState<OTPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUsed, setShowUsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOtpLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (showUsed) params.append("showUsed", "true");

      const res = await fetch(`/api/otp-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOtpLogs(data.otpLogs);
      }
    } catch (error) {
      console.error("Error fetching OTP logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOtpLogs();
  }, [searchQuery, showUsed]);

  const handleCopyOTP = async (otp: string, id: string) => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleMarkAsUsed = async (id: string) => {
    try {
      const res = await fetch("/api/otp-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchOtpLogs();
      }
    } catch (error) {
      console.error("Error marking OTP as used:", error);
    }
  };

  const getStatusBadge = (log: OTPLog) => {
    if (log.used) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full text-xs">
          <CheckCircle size={12} />
          Terpakai
        </span>
      );
    }
    if (log.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
          <XCircle size={12} />
          Kadaluarsa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs">
        <Clock size={12} />
        Aktif
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">OTP Logs</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Daftar OTP yang digenerate untuk fallback jika email gagal terkirim
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIM atau Email..."
              className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 w-full"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUsed}
              onChange={(e) => setShowUsed(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-secondary-600 focus:ring-secondary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Tampilkan yang sudah terpakai</span>
          </label>
        </div>
      </div>

      {/* OTP List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-700">
        {loading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">Memuat data...</div>
        ) : otpLogs.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            {searchQuery ? "Tidak ada OTP yang sesuai dengan pencarian" : "Belum ada OTP log"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">NIM</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">OTP</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Dibuat</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Kadaluarsa</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {otpLogs.map((log) => (
                  <tr key={log.id} className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="py-3 px-4 text-sm text-neutral-900 dark:text-neutral-100 font-medium">{log.nim}</td>
                    <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">{log.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-secondary-600 dark:text-secondary-400">{log.otp}</span>
                        <button
                          onClick={() => handleCopyOTP(log.otp, log.id)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Copy OTP"
                        >
                          {copiedId === log.id ? (
                            <Check size={14} className="text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy size={14} className="text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(log)}</td>
                    <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(log.expiresAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!log.used && !log.isExpired && (
                        <button
                          onClick={() => handleMarkAsUsed(log.id)}
                          className="px-3 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
                        >
                          Tandai Terpakai
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
