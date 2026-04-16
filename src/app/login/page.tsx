'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import ThemeToggle from '@/components/ThemeToggle';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [microsoftLoginEnabled, setMicrosoftLoginEnabled] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings/election', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        setMicrosoftLoginEnabled(data.microsoftLoginEnabled ?? true);
      } catch (error) {
        console.error('Failed to load login settings:', error);
      }
    };

    loadSettings();
  }, []);

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

  const handleSSOLogin = () => {
    window.location.href = '/api/auth/sso/init';
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GradientBackground />

      <a
        href="/"
        className="absolute top-6 left-6 z-50 p-3 rounded-full bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 border border-primary-200 dark:border-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <ArrowLeft size={24} className="text-neutral-700 dark:text-neutral-300" />
      </a>

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
            <p className="text-neutral-600 dark:text-neutral-400">Login ke Pemilu 8EH Radio ITB 2026</p>
          </div>

          {searchParams.get('error') === 'invalid_domain' && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              Akses ditolak. Gunakan email @mahasiswa.itb.ac.id.
            </div>
          )}

          {searchParams.get('error') === 'oauth_error' && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              Login dibatalkan. Silakan coba lagi.
            </div>
          )}

          {searchParams.get('error') === 'not_in_whitelist' && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              Akun Anda tidak terdaftar. Hubungi administrator.
            </div>
          )}

          {searchParams.get('error') && !['invalid_domain', 'oauth_error', 'not_in_whitelist'].includes(searchParams.get('error')!) && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              Terjadi kesalahan saat login. Silakan coba lagi.
            </div>
          )}

          <div className="space-y-4">
            {microsoftLoginEnabled ? (
              <>
                <button
                  onClick={handleSSOLogin}
                  className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-3 px-4 rounded-2xl hover:bg-red-700 transition-colors font-semibold shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Login dengan Microsoft ITB
                </button>

                <Link
                  href="/login-otp"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-primary-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/60 py-3 px-4 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-primary-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Login dengan OTP
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="w-full flex items-center justify-center gap-3 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 py-3 px-4 rounded-2xl font-semibold cursor-not-allowed"
                >
                  <svg className="w-5 h-5 opacity-60" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Login dengan Microsoft ITB
                </button>

                <Link
                  href="/login-otp"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 text-white py-3 px-4 text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Login dengan OTP
                </Link>
              </>
            )}
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
            {microsoftLoginEnabled
              ? 'Gunakan akun Microsoft ITB sebagai login utama. Login OTP tersedia sebagai alternatif.'
              : 'Gunakan OTP email mahasiswa ITB sebagai metode login.'}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen relative overflow-hidden">
          <GradientBackground />
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="text-neutral-600">Memuat...</div>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
