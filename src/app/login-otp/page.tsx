'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Hash, RefreshCw, ShieldCheck } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import ThemeToggle from '@/components/ThemeToggle';

const LAST_OTP_NIM_KEY = 'pemilu:last-otp-nim';

export default function LoginOtpPage() {
  const router = useRouter();
  const [nim, setNim] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'nim' | 'otp'>('nim');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const normalizedNim = nim.trim().replace(/\D/g, '').slice(0, 8);
  const isNimComplete = /^\d{8}$/.test(normalizedNim);
  const studentEmailPreview = isNimComplete
    ? `${normalizedNim}@mahasiswa.itb.ac.id`
    : 'XXXXXXXX@mahasiswa.itb.ac.id';

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return;

        const data = await res.json();
        if (data.authenticated) {
          router.push(data.isAdmin ? '/dashboard' : '/');
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedNim = window.localStorage.getItem(LAST_OTP_NIM_KEY);
    if (storedNim) {
      const sanitized = storedNim.replace(/\D/g, '').slice(0, 8);
      setNim(sanitized);
    }
  }, []);

  useEffect(() => {
    if (!isNimComplete) return;

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/otp/status?nim=${encodeURIComponent(normalizedNim)}`);
        const data = await res.json();

        if (res.ok && data.active) {
          setStep('otp');
          setOtpStatus(data.message || 'OTP masih aktif. Silakan cek email sebelumnya.');
          setExpiresAt(Date.now() + (data.expiresIn ?? 600) * 1000);
          window.localStorage.setItem(LAST_OTP_NIM_KEY, normalizedNim);
        }
      } catch (error) {
        console.error('Failed to check OTP status:', error);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [normalizedNim, isNimComplete]);

  const validateNim = () => {
    if (!isNimComplete) {
      setOtpError('NIM harus tepat 8 digit angka.');
      return false;
    }
    return true;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNim()) return;

    setIsSendingOtp(true);
    setOtpError('');
    setOtpStatus('');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: normalizedNim }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep('otp');
        setOtp('');
        setOtpStatus(data.message || 'OTP berhasil dikirim');
        setExpiresAt(Date.now() + (data.expiresIn ?? 600) * 1000);
        window.localStorage.setItem(LAST_OTP_NIM_KEY, normalizedNim);
      } else {
        setOtpError(data.error || 'Gagal mengirim OTP');
      }
    } catch {
      setOtpError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNim()) return;

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: normalizedNim, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        window.localStorage.setItem(LAST_OTP_NIM_KEY, normalizedNim);
        router.push('/');
      } else {
        setOtpError(data.error || 'OTP tidak valid');
      }
    } catch {
      setOtpError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!validateNim()) return;

    setIsSendingOtp(true);
    setOtpError('');
    setOtpStatus('');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim: normalizedNim, resend: true }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep('otp');
        setOtp('');
        setOtpStatus(data.message || 'OTP baru berhasil dikirim');
        setExpiresAt(Date.now() + (data.expiresIn ?? 600) * 1000);
        window.localStorage.setItem(LAST_OTP_NIM_KEY, normalizedNim);
      } else {
        setOtpError(data.error || 'Gagal mengirim ulang OTP');
      }
    } catch {
      setOtpError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GradientBackground />

      <Link
        href="/login"
        className="absolute top-6 left-6 z-50 p-3 rounded-full bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 border border-primary-200 dark:border-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <ArrowLeft size={24} className="text-neutral-700 dark:text-neutral-300" />
      </Link>

      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle className="p-3 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-neutral-800/50 rounded-full shadow-lg border border-primary-200 dark:border-neutral-700 transition-colors" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-primary-200/50 dark:border-neutral-700/50">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="8EH Radio ITB Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Ahoy Kru's</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Login dengan OTP ke email mahasiswa</p>
          </div>

          <div className="mb-6 rounded-2xl border border-primary-200/70 dark:border-neutral-700/80 bg-primary-50/70 dark:bg-neutral-800/60 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">
            Masukkan NIM anda. Alamat email <span className="font-medium">@mahasiswa.itb.ac.id</span> akan otomatis ditambahkan.
          </div>

          <form onSubmit={step === 'nim' ? handleSendOtp : handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">NIM</label>
              <div className="relative">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  disabled={step === 'otp'}
                  className="w-full pl-11 pr-40 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-[0.2em]"
                  placeholder="12345678"
                  inputMode="numeric"
                  pattern="\d{8}"
                  maxLength={8}
                  autoComplete="off"
                  required
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                  @mahasiswa.itb.ac.id
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {step === 'otp'
                  ? 'Tekan Ganti NIM jika ingin mengubah NIM'
                  : 'Masukkan tepat 8 digit NIM.'}
              </p>
            </div>

            {step === 'otp' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Kode OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent tracking-[0.35em] text-center text-lg"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>OTP dikirim ke {studentEmailPreview}</span>
                  {secondsLeft > 0 && <span>Berlaku {secondsLeft} detik</span>}
                </div>
              </>
            )}

            {otpError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                {otpError}
              </div>
            )}

            {otpStatus && !otpError && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>{otpStatus}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={step === 'nim' ? isSendingOtp || !isNimComplete : isVerifyingOtp || !isNimComplete || otp.length !== 6}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-2xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 'nim'
                  ? isSendingOtp
                    ? 'Mengirim OTP...'
                    : 'Kirim OTP'
                  : isVerifyingOtp
                    ? 'Memverifikasi...'
                    : 'Verifikasi OTP'}
              </button>

              {step === 'otp' && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('nim');
                      setOtp('');
                      setOtpError('');
                      setOtpStatus('');
                    }}
                    className="w-full flex-1 rounded-2xl border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Ganti NIM
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp || !isNimComplete}
                    className="w-full flex-1 rounded-2xl border border-primary-200 dark:border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} className={isSendingOtp ? 'animate-spin' : ''} />
                    Kirim ulang
                  </button>
                </div>
              )}
            </div>
          </form>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
            Kembali ke <Link href="/login" className="text-red-700 dark:text-red-400 font-medium hover:underline">halaman login</Link> jika ingin melihat opsi lain.
          </p>
        </div>
      </div>
    </main>
  );
}