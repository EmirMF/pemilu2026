'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import ThemeToggle from '@/components/ThemeToggle';

export default function PasswordLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.isAuthenticated) {
            router.push(data.isAdmin ? '/dashboard' : '/');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check session:', err);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(data.redirectTo);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GradientBackground />
      
      <a
        href="/login"
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
            <p className="text-neutral-600 dark:text-neutral-400">Login dengan Password</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                NIM
              </label>
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="12345678"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-2xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memuat...' : 'Login'}
            </button>
          </form>

          {/* <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
            Password diatur oleh admin
          </p> */}
        </div>
      </div>
    </main>
  );
}