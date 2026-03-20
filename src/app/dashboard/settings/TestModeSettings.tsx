'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function TestModeSettings() {
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/test-mode');
      if (res.ok) {
        const data = await res.json();
        setTestMode(data.testMode);
        setTestEmail(data.testEmail || '');
      }
    } catch (err) {
      console.error('Failed to fetch test mode settings:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode, testEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Test mode settings berhasil disimpan');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Gagal menyimpan settings');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-neutral-700">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
        Test Mode Settings
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        Test mode memungkinkan pengiriman OTP ke satu email saja untuk testing. Default: ON (untuk keamanan).
      </p>

      {message && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="testMode"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="w-4 h-4 text-red-600 bg-neutral-100 border-neutral-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
          />
          <label htmlFor="testMode" className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Enable Test Mode
          </label>
        </div>

        {testMode && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Test Email
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@mahasiswa.itb.ac.id"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Semua OTP akan dikirim ke email ini saat test mode aktif
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : 'Simpan Settings'}
        </Button>
      </div>
    </div>
  );
}
