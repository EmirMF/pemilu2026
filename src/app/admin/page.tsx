"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import GradientBackground from '@/components/GradientBackground';

export default function AdminLoginPage() {
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user already has valid session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          // Already logged in as admin, redirect to dashboard
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nim || !password) {
      setError('NIM dan password harus diisi');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login');
      }

      // Successfully logged in - redirect to dashboard
      router.push(data.redirectTo || '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="text-gray-900">Memuat...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <GradientBackground />
      <main className="min-h-screen flex items-center justify-center p-4 relative">
        {/* Back to Home Button */}
        <a
          href="/"
          className="absolute top-6 left-6 p-3 rounded-full bg-white/80 hover:bg-white border border-primary-200 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </a>

        <motion.div 
          className="w-full max-w-md bg-white rounded-3xl p-8 border border-primary-200 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Login Admin</h1>
            <p className="text-gray-600 text-sm">Masuk dengan NIM dan password admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="nim">
                NIM
              </label>
              <input
                id="nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="18224000"
                className="w-full px-4 py-3 rounded-lg bg-cream-50 border border-primary-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-secondary-500 transition-colors"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-cream-50 border border-primary-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-secondary-500 transition-colors"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && <p className="text-secondary-600 text-sm mt-2">{error}</p>}
            </div>

            <Button type="submit" className="w-full py-3 opacity-90 hover:opacity-100" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Ubah password di Dashboard → Settings
            </p>
          </form>
        </motion.div>
      </main>
    </>
  );
}
