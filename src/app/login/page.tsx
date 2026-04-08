'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import ThemeToggle from '@/components/ThemeToggle';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated) {
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

  useEffect(() => {
    searchParams.get('error');
  }, [searchParams]);

  const handleSSOLogin = () => {
    window.location.href = '/api/auth/sso/init';
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GradientBackground />
      
      {/* Back to Home Button */}
      <a
        href="/"
        className="absolute top-6 left-6 z-50 p-3 rounded-full bg-white/80 hover:bg-white dark:bg-neutral-900/80 dark:hover:bg-neutral-900 border border-primary-200 dark:border-neutral-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <ArrowLeft size={24} className="text-neutral-700 dark:text-neutral-300" />
      </a>
      
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
            <button
              onClick={handleSSOLogin}
              className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Login dengan akun Microsoft ITB
            </button>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
            Gunakan akun email @mahasiswa.itb.ac.id
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative overflow-hidden">
        <GradientBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-neutral-600">Memuat...</div>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}