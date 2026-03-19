"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";

interface Whitelist {
  id: string;
  nim: string;
  name?: string;
  isInDPT: boolean;
  createdAt: string;
}

export default function WhitelistSettings() {
  const [whitelists, setWhitelists] = useState<Whitelist[]>([]);
  const [newNim, setNewNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWhitelists = async () => {
    try {
      const res = await fetch("/api/settings/whitelist");
      if (res.ok) {
        const data = await res.json();
        setWhitelists(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data whitelist", err);
    }
  };

  useEffect(() => {
    fetchWhitelists();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNim.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/settings/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: newNim.trim() }),
      });

      if (res.ok) {
        setNewNim("");
        fetchWhitelists();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menambahkan NIM");
      }
    } catch (err) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus NIM ini dari whitelist?")) return;

    try {
      const res = await fetch(`/api/settings/whitelist/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWhitelists(whitelists.filter((w) => w.id !== id));
      }
    } catch (err) {
      console.error("Gagal menghapus NIM", err);
    }
  };

  const handleToggleDPT = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/settings/whitelist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isInDPT: !currentStatus }),
      });

      if (res.ok) {
        fetchWhitelists();
      }
    } catch (err) {
      console.error("Gagal mengubah status DPT", err);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={newNim}
            onChange={(e) => setNewNim(e.target.value)}
            placeholder="Masukkan NIM baru..."
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !newNim.trim()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
             <>
               <Plus size={20} /> Tambah
             </>
          )}
        </button>
      </form>

      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-left bg-white dark:bg-neutral-900">
          <thead className="bg-neutral-100 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">NIM</th>
              <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">Nama</th>
              <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300 text-center">Status DPT</th>
              <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300">Ditambahkan Pada</th>
              <th className="px-6 py-4 font-semibold text-neutral-700 dark:text-neutral-300 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {whitelists.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  Belum ada data whitelist.
                </td>
              </tr>
            ) : (
              whitelists.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 dark:bg-neutral-800 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">{item.nim}</td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">{item.name || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleDPT(item.id, item.isInDPT)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        item.isInDPT
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      title={item.isInDPT ? 'Klik untuk hapus dari DPT' : 'Klik untuk tambah ke DPT'}
                    >
                      {item.isInDPT ? (
                        <>
                          <Check size={16} /> Dalam DPT
                        </>
                      ) : (
                        <>
                          <X size={16} /> Bukan DPT
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
