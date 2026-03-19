"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ThemeToggle';
import { Image as ImageIcon, Link as LinkIcon, X, ArrowRight, User, UserCircle, Info } from 'lucide-react';

type Candidate = {
  id: string;
  photo: string;
  name: string;
  vision: string;
  mission?: string | null;
  draftLink?: string | null;
};

export default function VoteClient({ candidates }: { candidates: Candidate[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModalCandidate, setSelectedModalCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [userNim, setUserNim] = useState<string | null>(null);
  const [showAnonymousInfo, setShowAnonymousInfo] = useState(false);

  useEffect(() => {
    // Fetch user session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.nim) {
          setUserNim(data.nim)
        }
      })
      .catch(err => console.error('Failed to fetch session:', err))
  }, [])

  const handleVote = async () => {
    if (!selectedId) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim suara');
      }

      window.location.reload(); // Reload to show the "already voted" success screen
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Floating Theme Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle className="p-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 transition-all hover:scale-110" />
      </div>

      {/* User NIM Badge - Centered */}
      {userNim && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-secondary-200 dark:border-neutral-700 text-secondary-700 dark:text-secondary-400 rounded-full text-sm font-semibold shadow-lg">
            <User size={18} />
            <span>NIM: {userNim}</span>
            <div className="relative flex items-center">
              <button
                onClick={() => setShowAnonymousInfo(!showAnonymousInfo)}
                onMouseEnter={() => setShowAnonymousInfo(true)}
                onMouseLeave={() => setShowAnonymousInfo(false)}
                className="focus:outline-none flex items-center"
                aria-label="Info voting anonim"
              >
                <Info size={16} className="text-secondary-500 dark:text-secondary-400 cursor-pointer" />
              </button>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 dark:bg-neutral-800 text-white text-xs rounded-lg shadow-xl transition-all duration-200 z-10 ${showAnonymousInfo ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="text-center leading-relaxed">
                  Voting ini anonim. NIM hanya untuk verifikasi dan tidak tersimpan bersama pilihan Anda.
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-6 mb-12">
        {candidates.map((c) => (
          <motion.div
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full md:w-[calc(33.333%-1rem)] max-w-sm cursor-pointer rounded-3xl p-6 border-2 transition-all ${selectedId === c.id
              ? 'bg-secondary-50 dark:bg-secondary-900/30 border-secondary-500 dark:border-secondary-400 shadow-lg shadow-secondary-500/30'
              : 'bg-white dark:bg-neutral-900 border-primary-200 dark:border-neutral-700 hover:border-secondary-300 dark:hover:border-secondary-500'
              }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {c.photo ? (
              <img src={c.photo} alt={c.name} className="w-full rounded-2xl mb-4 object-cover aspect-square" draggable="false" onDragStart={(e) => e.preventDefault()} />
            ) : (
              <div className="w-full aspect-square rounded-2xl mb-4 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                <UserCircle size={120} className="text-neutral-400 dark:text-neutral-600" />
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{c.name}</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-3 mb-4">{c.vision}</p>
            
            {/* Lihat Detail button with underline animation */}
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedModalCandidate(c);
              }}
              className="relative inline-flex items-center gap-2 text-secondary-600 font-medium text-sm group"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <span className="relative inline-block">
                Lihat Detail
                <motion.span
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-secondary-500 to-secondary-600"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </span>
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {error && <p className="text-secondary-600 text-center mb-6">{error}</p>}

      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-white/60 dark:border-neutral-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-start gap-4">
            <label className="relative flex-shrink-0 mt-0.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-6 h-6 rounded-lg border-2 border-secondary-300 bg-white peer-checked:bg-secondary-500 peer-checked:border-secondary-500 transition-all duration-200 flex items-center justify-center group-hover:border-secondary-400 group-hover:shadow-md">
                <svg
                  className={`w-4 h-4 text-white transition-all duration-200 ${
                    agreed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </label>
            <span className="text-neutral-800 dark:text-neutral-200 leading-relaxed select-none">
              Dengan ini saya menyatakan bahwa saya mengetahui dan menyetujui tata cara serta peraturan pemilihan General Manager 8EH Radio ITB periode 2026/2027, dan suara yang saya berikan adalah murni kehendak saya sendiri tanpa paksaan dari pihak manapun.
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleVote}
          disabled={!selectedId || !agreed || loading}
          className={`px-12 py-4 text-md ${(!selectedId || !agreed) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Memproses...' : 'Kirim Suara'}
        </Button>
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {selectedModalCandidate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedModalCandidate(null)}
          >
            <motion.div
              className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-primary-200 dark:border-neutral-700 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="sticky top-0 bg-cream-50 dark:bg-neutral-950 border-b border-primary-200 dark:border-neutral-700 p-4 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Detail Kandidat</h3>
                <button
                  onClick={() => setSelectedModalCandidate(null)}
                  className="p-2 hover:bg-primary-100 dark:hover:bg-neutral-800 rounded-full transition"
                >
                  <X size={24} className="text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Photo */}
                {selectedModalCandidate.photo ? (
                  <div className="w-full h-80 bg-cream-100 rounded-2xl overflow-hidden mb-6">
                    <img
                      src={selectedModalCandidate.photo}
                      draggable="false"
                      onDragStart={(e) => e.preventDefault()}
                      alt={selectedModalCandidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 bg-cream-100 rounded-2xl flex items-center justify-center mb-6">
                    <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-600">
                      <ImageIcon size={48} />
                      <div>Belum ada foto</div>
                    </div>
                  </div>
                )}

                {/* Name */}
                <h4 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">{selectedModalCandidate.name}</h4>

                {/* Vision */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-secondary-600 mb-2">Visi</h5>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedModalCandidate.vision}</p>
                </div>

                {/* Mission */}
                {selectedModalCandidate.mission && (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-secondary-600 mb-2">Misi</h5>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{selectedModalCandidate.mission}</p>
                  </div>
                )}

                {/* Draft Link Button */}
                {selectedModalCandidate.draftLink ? (
                  <a
                    href={selectedModalCandidate.draftLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-full bg-red-600 hover:bg-secondary-600 transition-all duration-300 font-medium text-white inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform"
                  >
                    <LinkIcon size={18} /> Baca Draf Lengkap
                  </a>
                ) : (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-3">
                    Draf kandidat belum tersedia
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
