"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";

interface Voter {
  id: string;
  nim: string;
  angkatan: number | null;
  name: string | null;
  email: string;
  hasVoted: boolean;
  votedAt: string | null;
  createdAt: string;
}

type SortField = 'nim' | 'email' | 'hasVoted' | 'votedAt';
type SortOrder = 'asc' | 'desc';

export default function VotersClient() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAngkatan, setSelectedAngkatan] = useState("");
  const [sortField, setSortField] = useState<SortField>('votedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      const res = await fetch('/api/settings/voters');
      if (res.ok) {
        const data = await res.json();
        setVoters(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data pemilih", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const availableAngkatan = useMemo(() => {
    return Array.from(
      new Set(voters.map((voter) => voter.angkatan).filter((angkatan): angkatan is number => angkatan !== null))
    ).sort((a, b) => a - b);
  }, [voters]);

  const filteredAndSortedVoters = useMemo(() => {
    let filtered = voters.filter(voter => 
      voter.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voter.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voter.angkatan?.toString() || '').includes(searchQuery.toLowerCase())
    );

    if (selectedAngkatan) {
      filtered = filtered.filter((voter) => voter.angkatan?.toString() === selectedAngkatan);
    }

    filtered.sort((a, b) => {
      let aValue: string | boolean | Date;
      let bValue: string | boolean | Date;

      switch (sortField) {
        case 'nim':
          aValue = a.nim;
          bValue = b.nim;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'hasVoted':
          aValue = a.hasVoted;
          bValue = b.hasVoted;
          break;
        case 'votedAt':
          aValue = a.votedAt ? new Date(a.votedAt) : new Date(0);
          bValue = b.votedAt ? new Date(b.votedAt) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [voters, searchQuery, selectedAngkatan, sortField, sortOrder]);

  const votedCount = useMemo(
    () => filteredAndSortedVoters.filter((voter) => voter.hasVoted).length,
    [filteredAndSortedVoters]
  );

  const notVotedCount = useMemo(
    () => filteredAndSortedVoters.filter((voter) => !voter.hasVoted).length,
    [filteredAndSortedVoters]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-neutral-800 dark:text-neutral-100">Data Pemilih</h2>
          <p className="text-sm lg:text-base text-neutral-500 dark:text-neutral-400">Daftar pemilih Pemilihan General Manager 8EH Radio ITB 2026/2027</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6 lg:p-8">
          <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm lg:text-base">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold text-neutral-800 dark:text-neutral-100">Data Pemilih</h2>
        <p className="text-sm lg:text-base text-neutral-500 dark:text-neutral-400">Daftar pemilih Pemilihan General Manager 8EH Radio ITB 2026/2027</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base lg:text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                Total Pemilih: {filteredAndSortedVoters.length}
              </h3>
              <p className="text-xs lg:text-sm text-neutral-500 dark:text-neutral-400">
                Sudah memilih: {votedCount} · Belum memilih: {notVotedCount}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <select
                  value={selectedAngkatan}
                  onChange={(e) => setSelectedAngkatan(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-9 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-sm lg:text-base"
                >
                  <option value="">Semua angkatan</option>
                  {availableAngkatan.map((angkatan) => (
                    <option key={angkatan} value={angkatan.toString()}>
                      {angkatan}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari NIM, Nama, Email, atau Angkatan..."
                  className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 w-full sm:w-64 text-sm lg:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-275">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  <button
                    onClick={() => handleSort('nim')}
                    className="flex items-center gap-1 hover:text-secondary-600 transition-colors"
                  >
                    NIM
                    <ArrowUpDown size={12} className={sortField === 'nim' ? 'text-secondary-600' : ''} />
                  </button>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  Nama
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  Angkatan
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-secondary-600 transition-colors"
                  >
                    Email
                    <ArrowUpDown size={12} className={sortField === 'email' ? 'text-secondary-600' : ''} />
                  </button>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  <button
                    onClick={() => handleSort('hasVoted')}
                    className="flex items-center gap-1 hover:text-secondary-600 transition-colors"
                  >
                    Status
                    <ArrowUpDown size={12} className={sortField === 'hasVoted' ? 'text-secondary-600' : ''} />
                  </button>
                </th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 font-semibold text-neutral-600 dark:text-neutral-400 text-xs lg:text-sm">
                  <button
                    onClick={() => handleSort('votedAt')}
                    className="flex items-center gap-1 hover:text-secondary-600 transition-colors"
                  >
                    Tanggal Vote
                    <ArrowUpDown size={12} className={sortField === 'votedAt' ? 'text-secondary-600' : ''} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {filteredAndSortedVoters.map((voter) => (
                <tr key={voter.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-neutral-900 dark:text-neutral-100 font-medium text-xs lg:text-sm">{voter.nim}</td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-neutral-900 dark:text-neutral-100 text-xs lg:text-sm">{voter.name || '-'}</td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-neutral-900 dark:text-neutral-100 text-xs lg:text-sm">
                    {voter.angkatan ?? '-'}
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-neutral-500 dark:text-neutral-400 text-xs lg:text-sm truncate max-w-37.5 lg:max-w-none">{voter.email}</td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    {voter.hasVoted ? (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 lg:px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap">
                        <span className="hidden sm:inline">Sudah Memilih</span>
                        <span className="sm:hidden">✓</span>
                      </span>
                    ) : (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 lg:px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap">
                        <span className="hidden sm:inline">Belum Memilih</span>
                        <span className="sm:hidden">-</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-neutral-500 dark:text-neutral-400 text-xs lg:text-sm">
                    {voter.votedAt ? (
                      <>
                        <span className="hidden lg:inline">
                          {new Date(voter.votedAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="lg:hidden">
                          {new Date(voter.votedAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAndSortedVoters.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 lg:px-6 py-6 lg:py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm lg:text-base">
                    {searchQuery ? "Tidak ada pemilih yang sesuai dengan pencarian" : "Tidak ada data pemilih."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
