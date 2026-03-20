'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GradientBackground from '@/components/GradientBackground';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'nim' | 'password' | 'sendOtp' | 'otp' | 'setPassword' | 'forgotPassword'>('nim');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);

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
      // Check if user has password and active OTP
      const checkRes = await fetch('/api/auth/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail }),
      });

      const checkData = await checkRes.json();

      if (checkRes.ok) {
        // Prioritize active OTP over password
        if (checkData.hasActiveOTP) {
          // User has active OTP, go directly to OTP input
          setMessage('Kode OTP masih aktif. Silakan masukkan kode OTP yang telah dikirim.');
          setStep('otp');
        } else if (checkData.hasPassword) {
          // User has password, show password input
          setStep('password');
        } else {
          // User doesn't have password and no active OTP, show send OTP button
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
      } else {
        setError(otpData.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Reset failed attempts on successful login
        setFailedLoginAttempts(0);
        // Redirect all users to homepage
        router.push('/');
      } else {
        // Increment failed attempts
        setFailedLoginAttempts(prev => prev + 1);
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('');
    setMessage('');
    setIsResettingPassword(true);
    setStep('forgotPassword');
  };

  const handleSendResetOTP = async () => {
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
        setMessage(otpData.message || 'Kode OTP untuk reset password telah dikirim ke email Anda');
        setStep('otp');
      } else {
        setError(otpData.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        // OTP verified, now ask to set password
        if (isResettingPassword) {
          setMessage('OTP berhasil diverifikasi. Silakan set password baru Anda.');
        } else {
          setMessage('OTP berhasil diverifikasi. Silakan set password Anda.');
        }
        setStep('setPassword');
      } else {
        setError(data.error || 'Kode OTP salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password berhasil diset. Anda akan diarahkan...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(data.error || 'Gagal set password');
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
      } else {
        setError(data.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

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
            </form>
          )}

          {step === 'sendOtp' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <span className="font-medium">Email:</span> {email}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Anda belum memiliki password. Silakan kirim kode OTP untuk verifikasi.
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

          {step === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  required
                />
                {failedLoginAttempts >= 5 && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-red-600 hover:text-red-800 mt-1"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Login...' : 'Login'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('nim')}
                className="w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm"
              >
                ← Kembali
              </button>
            </form>
          )}

          {step === 'forgotPassword' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <span className="font-medium">Email:</span> {email}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Kami akan mengirim kode OTP untuk reset password Anda.
                </p>
              </div>
              <Button
                onClick={handleSendResetOTP}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsResettingPassword(false);
                  setStep('password');
                }}
                className="w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm"
              >
                ← Kembali
              </button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOTPVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 text-center">
                  Masukkan Kode OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-6 py-4 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-center text-3xl font-bold tracking-[0.5em]"
                  required
                />
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 text-center">
                  Kode OTP telah dikirim ke<br />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{email}</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Verifikasi...' : 'Verifikasi OTP'}
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Kirim Ulang OTP
              </button>
            </form>
          )}

          {step === 'setPassword' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Menyimpan...' : 'Set Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
