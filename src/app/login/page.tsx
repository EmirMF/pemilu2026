'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GradientBackground from '@/components/GradientBackground';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'nim' | 'sendOtp' | 'otp'>('nim');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Refs for OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Save state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loginState', JSON.stringify({
        step,
        nim,
        email,
        message
      }));
    }
  }, [step, nim, email, message]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated) {
            // User already logged in, redirect to homepage
            router.push('/');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      }
    };

    checkSession();
  }, [router]);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('loginState');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.step && parsed.step !== 'nim') {
            setStep(parsed.step);
          }
          if (parsed.nim) {
            setNim(parsed.nim);
          }
          if (parsed.email) {
            setEmail(parsed.email);
          }
          if (parsed.message) {
            setMessage(parsed.message);
          }
        } catch (e) {
          console.error('Failed to restore login state:', e);
        }
      }
    }
  }, []);

  const handleNimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fullEmail = `${nim}@mahasiswa.itb.ac.id`;
    setEmail(fullEmail);

    try {
      // Check if user has active OTP
      const checkRes = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      const checkData = await checkRes.json();

      if (checkRes.ok) {
        if (checkData.hasActiveOTP) {
          // User has active OTP, go directly to OTP input
          setMessage('Kode OTP masih aktif. Silakan masukkan kode OTP yang telah dikirim.');
          setStep('otp');
        } else {
          // No active OTP, show send OTP button
          setStep('sendOtp');
        }
      } else {
        setError(checkData.error || 'Terjadi kesalahan');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json();

      if (otpRes.ok) {
        setMessage(otpData.message || 'Kode OTP telah dikirim ke email Anda');
        setStep('otp');
        // Focus first OTP input after a short delay
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      } else {
        setError(otpData.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      otpInputRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        // OTP verified, user is now logged in
        setMessage('Login berhasil! Mengalihkan...');
        // Clear session storage
        sessionStorage.removeItem('loginState');
        // Redirect to homepage
        setTimeout(() => {
          router.push(data.redirect || '/');
        }, 1000);
      } else {
        setError(data.error || 'Kode OTP salah');
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Kode OTP baru telah dikirim');
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GradientBackground />
      
      {/* Theme Toggle Button - Fixed Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle className="p-3 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-neutral-800/50 rounded-full shadow-lg border border-primary-200 dark:border-neutral-700 transition-colors" />
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
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
            <p className="text-neutral-600 dark:text-neutral-400">Login ke Pemilu App 8EH Radio ITB 2026</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
              {message}
            </div>
          )}

          {step === 'nim' && (
            <form onSubmit={handleNimSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email ITB
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="NIM"
                    className="w-full px-4 py-3 pr-[9rem] sm:pr-52 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div className="absolute right-4 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 pointer-events-none text-[0.8rem] sm:text-sm whitespace-nowrap">
                    @mahasiswa.itb.ac.id
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Memproses...' : 'Lanjutkan'}
              </Button>
              {/* <div className="text-center mt-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Admin? <a href="/admin" className="text-red-600 hover:text-red-700 font-medium">Login di sini</a>
                </p>
              </div> */}
            </form>
          )}

          {step === 'sendOtp' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <span className="font-medium">Email:</span> {email}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Kami akan mengirim kode OTP ke email Anda untuk verifikasi login.
                </p>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('nim')}
                className="w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm"
              >
                ← Kembali
              </button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOTPVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                  Masukkan Kode OTP
                </label>
                <div className="flex justify-center gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      onPaste={index === 0 ? handleOTPPaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-semibold border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                      required
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                  Kode OTP telah dikirim ke {email}
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading || !isOtpComplete}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi & Login'}
              </Button>
              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('nim');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                >
                  Kirim ulang OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
