'use client';

import { useState, useEffect } from 'react';

export default function BadgeVisibilitySettings() {
  const [showVotingStatus, setShowVotingStatus] = useState(true);
  const [showUserVoteStatus, setShowUserVoteStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch current settings
    fetch('/api/settings/election')
      .then(res => res.json())
      .then(data => {
        setShowVotingStatus(data.showVotingStatus ?? true);
        setShowUserVoteStatus(data.showUserVoteStatus ?? true);
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings/election', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showVotingStatus,
          showUserVoteStatus,
        }),
      });

      if (res.ok) {
        setMessage('Pengaturan berhasil disimpan');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Status Voting (Dibuka/Ditutup)</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Tampilkan badge status voting di landing page
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showVotingStatus}
              onChange={(e) => setShowVotingStatus(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Status Vote User</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Tampilkan badge "Sudah vote" / "Belum vote" untuk user yang login
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showUserVoteStatus}
              onChange={(e) => setShowUserVoteStatus(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('berhasil') ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </div>
  );
}
