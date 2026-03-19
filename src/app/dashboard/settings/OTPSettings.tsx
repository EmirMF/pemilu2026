'use client';

import { useState, useEffect } from 'react';

export default function OTPSettings() {
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/election');
      const data = await res.json();
      if (data.otpEnabled !== undefined) {
        setOtpEnabled(data.otpEnabled);
      }
    } catch (error) {
      console.error('Error fetching OTP settings:', error);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpEnabled: !otpEnabled })
      });

      const data = await res.json();

      if (res.ok) {
        setOtpEnabled(!otpEnabled);
        setMessage('Pengaturan OTP berhasil diperbarui');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Gagal memperbarui pengaturan OTP');
      }
    } catch (error) {
      console.error('Error updating OTP settings:', error);
      setMessage('Terjadi kesalahan saat memperbarui pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
            Status OTP Authentication
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {otpEnabled
              ? 'OTP aktif - User akan menerima kode OTP via email'
              : 'OTP nonaktif - User tidak dapat login dengan OTP'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
            otpEnabled ? 'bg-orange-500' : 'bg-neutral-300 dark:bg-neutral-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              otpEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('berhasil')
            ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Peringatan</h5>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Jika OTP dinonaktifkan, user yang menekan tombol "Kirim OTP" akan melihat pesan bahwa OTP sedang tidak aktif dan diminta menghubungi admin. User tidak akan dapat login tanpa password yang sudah di-set sebelumnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
