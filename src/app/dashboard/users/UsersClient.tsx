"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, Shield, ShieldOff, Search, ArrowUpDown, Download, Upload, Edit2, Check, X, CheckCircle, XCircle, Key, KeyRound } from "lucide-react";

interface User {
  id: string;
  nim: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  isInDPT: boolean;
  hasPassword: boolean;
  createdAt: string;
}

type SortField = 'nim' | 'email' | 'createdAt' | 'isAdmin';
type SortOrder = 'asc' | 'desc';

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [newNim, setNewNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserNim, setCurrentUserNim] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/settings/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data users", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.nim) {
          setCurrentUserNim(data.nim);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil session", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNim.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: newNim.trim() }),
      });

      if (res.ok) {
        setNewNim("");
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menambahkan user");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menambahkan user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;

    try {
      const res = await fetch(`/api/settings/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Gagal menghapus user", err);
    }
  };

  const handleToggleAdmin = async (nim: string, currentIsAdmin: boolean) => {
    try {
      const res = await fetch("/api/settings/users/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim, isAdmin: !currentIsAdmin }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengubah status admin");
      }
    } catch (err) {
      console.error("Gagal mengubah status admin", err);
      alert("Terjadi kesalahan saat mengubah status admin");
    }
  };

  const handleToggleDPT = async (nim: string, currentIsInDPT: boolean) => {
    try {
      const res = await fetch("/api/settings/users/dpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim, isInDPT: !currentIsInDPT }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengubah status DPT");
      }
    } catch (err) {
      console.error("Gagal mengubah status DPT", err);
      alert("Terjadi kesalahan saat mengubah status DPT");
    }
  };

  const handleResetPassword = async (nim: string) => {
    if (!confirm(`Yakin ingin reset password untuk NIM ${nim}? Password akan dihapus dan user harus set password baru.`)) return;

    try {
      const res = await fetch("/api/settings/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim }),
      });

      if (res.ok) {
        alert("Password berhasil direset");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal reset password");
      }
    } catch (err) {
      console.error("Gagal reset password", err);
      alert("Terjadi kesalahan saat reset password");
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/settings/users/export');
      if (!response.ok) throw new Error('Gagal export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Gagal export data users');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const response = await fetch('/api/settings/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: text }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(result.message);
        if (result.results.errors.length > 0) {
          console.error('Import errors:', result.results.errors);
        }
        fetchUsers();
      } else {
        alert(result.error || 'Gagal import data');
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Gagal import data users');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditName = (userId: string, currentName: string | null) => {
    setEditingUserId(userId);
    setEditingName(currentName || "");
  };

  const handleSaveName = async (userId: string) => {
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (res.ok) {
        // Update local state
        setUsers(users.map(u =>
          u.id === userId ? { ...u, name: editingName.trim() || null } : u
        ));
        setEditingUserId(null);
        setEditingName("");
      } else {
        alert('Gagal mengupdate nama');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Terjadi kesalahan saat mengupdate nama');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingName("");
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
        case 'isAdmin':
          aValue = a.isAdmin;
          bValue = b.isAdmin;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, sortField, sortOrder]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-neutral-800 dark:text-neutral-100">Manajemen User</h2>
          <p className="text-sm lg:text-base text-neutral-500 dark:text-neutral-400 mt-1">
            Kelola whitelist NIM dan assign admin untuk sistem pemilihan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors text-sm lg:text-base"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 transition-colors text-sm lg:text-base"
          >
            <Upload size={18} />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Add User Form */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 lg:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <h3 className="text-lg lg:text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">Tambah User Baru</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newNim}
            onChange={(e) => setNewNim(e.target.value)}
            placeholder="Masukkan NIM (contoh: 13521001)"
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-sm lg:text-base"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newNim.trim()}
            className="px-6 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm lg:text-base whitespace-nowrap"
          >
            <Plus size={18} />
            {loading ? "Menambahkan..." : "Tambah"}
          </button>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <p className="text-neutral-500 dark:text-neutral-400 text-xs lg:text-sm mt-3">
          User yang ditambahkan akan masuk ke whitelist dan bisa login untuk voting.
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 lg:p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg lg:text-xl font-semibold text-neutral-800 dark:text-neutral-100">
            Daftar User ({filteredAndSortedUsers.length})
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIM atau Email..."
              className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 w-full sm:w-64 text-sm lg:text-base"
            />
          </div>
        </div>
        
        {filteredAndSortedUsers.length === 0 ? (
          <p className="text-neutral-500 dark:text-neutral-400 text-center py-8 text-sm lg:text-base">
            {searchQuery ? "Tidak ada user yang sesuai dengan pencarian" : "Belum ada user terdaftar"}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 lg:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <button
                      onClick={() => handleSort('nim')}
                      className="flex items-center gap-1 hover:text-secondary-600 transition-colors text-xs lg:text-sm"
                    >
                      NIM
                      <ArrowUpDown size={12} className={sortField === 'nim' ? 'text-secondary-600' : ''} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Nama</th>
                  <th className="text-left py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center gap-1 hover:text-secondary-600 transition-colors text-xs lg:text-sm"
                    >
                      Email
                      <ArrowUpDown size={12} className={sortField === 'email' ? 'text-secondary-600' : ''} />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <button
                      onClick={() => handleSort('isAdmin')}
                      className="flex items-center gap-1 hover:text-secondary-600 transition-colors text-xs lg:text-sm"
                    >
                      Status
                      <ArrowUpDown size={12} className={sortField === 'isAdmin' ? 'text-secondary-600' : ''} />
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">DPT</th>
                  <th className="text-center py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Password</th>
                  <th className="text-left py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 hover:text-secondary-600 transition-colors text-xs lg:text-sm"
                    >
                      Tanggal
                      <ArrowUpDown size={12} className={sortField === 'createdAt' ? 'text-secondary-600' : ''} />
                    </button>
                  </th>
                  <th className="text-right py-3 px-4 text-xs lg:text-sm font-semibold text-neutral-700 dark:text-neutral-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="py-3 px-4 text-xs lg:text-sm text-neutral-900 dark:text-neutral-100 font-medium">{user.nim}</td>
                    <td className="py-3 px-4 text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 border border-neutral-300 dark:border-neutral-700 rounded text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-secondary-500 w-full max-w-[150px]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(user.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <button
                            onClick={() => handleSaveName(user.id)}
                            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                            title="Simpan"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            title="Batal"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span>{user.name || '-'}</span>
                          <button
                            onClick={() => handleEditName(user.id, user.name)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-opacity"
                            title="Edit nama"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs lg:text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-[150px]">{user.email}</td>
                    <td className="py-3 px-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                          <Shield size={12} />
                          <span className="hidden sm:inline">Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium">
                          <span className="hidden sm:inline">User</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleDPT(user.nim, user.isInDPT)}
                        className={`inline-flex items-center gap-1 px-2 lg:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isInDPT
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        title={user.isInDPT ? 'Klik untuk hapus dari DPT' : 'Klik untuk tambah ke DPT'}
                      >
                        {user.isInDPT ? (
                          <>
                            <CheckCircle size={12} />
                            <span className="hidden sm:inline">Ya</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span className="hidden sm:inline">Tidak</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.hasPassword ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                              <Key size={12} />
                              <span className="hidden sm:inline">Set</span>
                            </span>
                            {!user.isAdmin && (
                              <button
                                onClick={() => handleResetPassword(user.nim)}
                                className="p-1 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound size={14} />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-medium">
                            <XCircle size={12} />
                            <span className="hidden sm:inline">Belum</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      {user.nim === currentUserNim ? (
                        <div className="flex items-center justify-end">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 italic"></span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 lg:gap-2">
                          <button
                            onClick={() => handleToggleAdmin(user.nim, user.isAdmin)}
                            className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
                              user.isAdmin
                                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            title={user.isAdmin ? 'Hapus Admin' : 'Jadikan Admin'}
                          >
                            {user.isAdmin ? <ShieldOff size={16} /> : <Shield size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 lg:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
