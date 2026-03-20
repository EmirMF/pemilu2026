'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Database } from 'lucide-react';

export default function OTPDashboardOnlySettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/election');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setEnabled(data.otpDashboardOnly ?? false);
    } catch (err) {
      console.error('Error fetching OTP Dashboard Only settings:', err);
      setError('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setSaving(true);
    setError('');
    
    try {
      const res = await fetch('/api/settings/election', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpDashboardOnly: !enabled }),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      
      const data = await res.json();
      setEnabled(data.otpDashboardOnly);
    } catch (err) {
      console.error('Error updating OTP Dashboard Only settings:', err);
      setError('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              OTP Dashboard Only Mode
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Mode khusus untuk menyimpan OTP ke database tanpa mengirim email. 
            User harus meminta OTP ke admin secara manual melalui dashboard OTP Logs.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Perhatian:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email OTP TIDAK akan dikirim sama sekali</li>
                  <li>User harus meminta OTP ke admin on-site</li>
                  <li>Admin harus membuka dashboard OTP Logs untuk melihat kode</li>
                  <li>Berguna untuk testing atau saat email service down</li>
                </ul>
              </div>
            </div>
          </div>

          {enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ✓ Mode Dashboard Only aktif. OTP akan disimpan ke database tanpa mengirim email.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={saving}
          className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
