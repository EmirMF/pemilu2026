"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GradientBackground from '@/components/GradientBackground';

type AccordionItem = {
  id: number;
  title: string;
  content: string[];
};

const tataCara: AccordionItem[] = [
  {
    id: 1,
    title: 'Langkah 1 - Login',
    content: [
      'Klik tombol "Vote Sekarang" di halaman utama',
      'Masukkan NIM Anda',
      'Masukkan password yang telah Anda buat',
      'Klik "Login"',
    ],
  },
  {
    id: 2,
    title: 'Langkah 2 - Pilih Kandidat',
    content: [
      'Baca visi misi setiap kandidat dengan seksama',
      'Klik card kandidat pilihan Anda',
      'Pastikan kandidat yang dipilih sudah benar',
    ],
  },
  {
    id: 3,
    title: 'Langkah 3 - Konfirmasi Pilihan',
    content: [
      'Review kembali pilihan Anda',
      'Klik tombol "Kirim Suara"',
      'Konfirmasi pilihan Anda pada dialog yang muncul',
    ],
  },
  {
    id: 4,
    title: 'Langkah 4 - Selesai',
    content: [
      'Suara Anda tercatat dengan aman',
      'Voting bersifat anonim dan rahasia',
      'Anda tidak bisa voting ulang',
      'Hasil akan diumumkan sesuai jadwal',
    ],
  },
];

export default function TataCaraPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <main className="min-h-screen relative">
      <GradientBackground />
      <Navbar />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-24 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center my-24"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Tata Cara Voting</h1>
          <p className="text-xl text-neutral-700 dark:text-neutral-300">Panduan Singkat E-Voting</p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-4">
          {tataCara.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-primary-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-cream-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                      <span className="text-secondary-600 dark:text-secondary-400 font-bold">{item.id}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 text-left">
                      {item.title}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openId === item.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={24} className="text-neutral-600 dark:text-neutral-400" />
                  </motion.div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {openId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-primary-100 dark:border-neutral-700">
                        <ul className="space-y-3">
                          {item.content.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2
                                size={20}
                                className="text-secondary-500 dark:text-secondary-400 flex-shrink-0 mt-0.5"
                              />
                              <span className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white/80 dark:bg-neutral-900/80 rounded-2xl border border-primary-200 dark:border-neutral-700 p-6 shadow-lg">
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold">Penting:</span> Suara yang sudah dikirim tidak dapat diubah. Jika ada kendala, hubungi panitia pemilihan.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
