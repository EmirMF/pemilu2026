"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import GradientBackground from '@/components/GradientBackground';

export default function VerifyPage() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isElectionOpen, setIsElectionOpen] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/get-otp-email')
      .then(res => {
        if (!res.ok) {
          setSessionExpired(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.email) {
          setEmail(data.email);
        } else if (data) {
          setSessionExpired(true);
        }
      })
      .catch(() => setSessionExpired(true));

    fetch('/api/settings/election')
      .then(res => res.json())
      .then(data => setIsElectionOpen(data.isOpen))
      .catch(() => setIsElectionOpen(false));
  }, [router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Kode OTP harus 6 digit angka.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verifikasi gagal.');
      }

      router.push('/vote');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email || resendCooldown > 0) return;

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim ulang OTP');
      }

      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (sessionExpired) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-md bg-white rounded-3xl p-8 border border-primary-200 shadow-2xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sesi Kedaluwarsa</h1>
            <p className="text-gray-600 mb-6">Sesi verifikasi OTP Anda telah kedaluwarsa. Silakan login kembali.</p>
            <Button onClick={() => router.push('/login')} className="w-full py-3">
              Kembali ke Login
            </Button>
          </motion.div>
        </main>
      </>
    );
  }

  if (!email || isElectionOpen === null) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="text-gray-900">Memuat...</div>
        </main>
      </>
    );
  }

  if (!isElectionOpen) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-md bg-white rounded-3xl p-8 border border-primary-200 shadow-2xl text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pemilihan Ditutup</h1>
            <p className="text-gray-600">Maaf, pemilihan saat ini sedang tidak berlangsung.</p>
          </motion.div>
        </main>
      </>
    );
  }

  return (
    <>
      <GradientBackground />
      <main className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-md bg-white rounded-3xl p-8 border border-primary-200 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verifikasi OTP</h1>
            <p className="text-gray-600 text-sm">
              Kode 6 digit telah dikirimkan ke <br/><span className="text-secondary-600 font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="otp">
                Kode OTP
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono px-4 py-4 rounded-lg bg-cream-50 border border-primary-300 text-gray-900 placeholder-gray-300 focus:outline-none focus:border-secondary-500 transition-colors tracking-[0.5em]"
                required
                disabled={loading}
                style={{ letterSpacing: '0.5em', paddingLeft: 'calc(0.5em + 1rem)' }}
              />
              {error && <p className="text-secondary-600 text-sm mt-2">{error}</p>}
            </div>

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || resendCooldown > 0}
              className="text-sm text-secondary-600 hover:text-secondary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {resending
                ? 'Mengirim ulang...'
                : resendCooldown > 0
                ? `Kirim ulang dalam ${resendCooldown}s`
                : 'Kirim Ulang OTP'}
            </button>
          </div>
        </motion.div>
      </main>
    </>
  );
}
