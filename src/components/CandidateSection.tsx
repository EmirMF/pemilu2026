'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';
import { useState } from 'react';
import SpotlightCard from './SpotlightCard';

type Candidate = {
  id: string
  name: string
  vision: string
  mission?: string | null
  photo: string | null
  draftLink?: string | null
}

export default function CandidateSection({ candidates }: { candidates: Candidate[] }) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  return (
    <section id="candidates" className="py-24 text-neutral-900 dark:text-neutral-50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-2">
            Kandidat <span className="bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">General Manager</span>
          </h2>
          <h3 className="text-4xl font-semibold mb-4">8EH Radio ITB 2026/2027</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Kenali calon pemimpinmu sebelum menentukan pilihan</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {candidates.map((candidate, i) => (
            <motion.div
              key={candidate.id}
              className="w-full md:w-[calc(33.333%-1.5rem)] max-w-sm"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <SpotlightCard
                className="!bg-white dark:!bg-neutral-900 !border-primary-200 dark:!border-neutral-700 hover:!border-secondary-400 dark:hover:!border-secondary-500 !p-0 h-full flex flex-col"
                spotlightColor="rgba(255, 195, 10, 0.2)"
              >
                {candidate.photo ? (
                  <div className="h-64 bg-cream-100 dark:bg-neutral-800 overflow-hidden rounded-t-3xl">
                    <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" draggable="false" onDragStart={(e) => e.preventDefault()} />
                  </div>
                ) : (
                  <div className="h-64 bg-cream-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden rounded-t-3xl">
                    <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-500">
                      <ImageIcon size={42} className="text-neutral-300 dark:text-neutral-600" />
                      <div className="text-sm">Belum ada foto</div>
                    </div>
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-2">{candidate.name}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm flex-1">{candidate.vision}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(candidate)}
                    className="w-full py-3 rounded-full bg-red-600 hover:bg-secondary-600 transition-all duration-300 font-medium text-sm text-white shadow-md hover:shadow-lg transform"
                  >
                    Lihat Detail
                  </button>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {candidates.length === 0 && (
          <div className="mt-10 text-center text-neutral-600 dark:text-neutral-400">Belum ada kandidat yang ditambahkan.</div>
        )}
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCandidate(null)}
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
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 hover:bg-primary-100 dark:hover:bg-neutral-800 rounded-full transition"
                >
                  <X size={24} className="text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Photo */}
                {selectedCandidate.photo ? (
                  <div className="w-full h-80 bg-cream-100 dark:bg-neutral-800 rounded-2xl overflow-hidden mb-6">
                    <img
                      src={selectedCandidate.photo}
                      draggable="false"
                      onDragStart={(e) => e.preventDefault()}
                      alt={selectedCandidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 bg-cream-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
                    <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-500">
                      <ImageIcon size={48} />
                      <div>Belum ada foto</div>
                    </div>
                  </div>
                )}

                {/* Name */}
                <h4 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">{selectedCandidate.name}</h4>

                {/* Vision */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-secondary-600 dark:text-secondary-400 mb-2">Visi</h5>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{selectedCandidate.vision}</p>
                </div>

                {/* Mission */}
                {selectedCandidate.mission && (
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-secondary-600 dark:text-secondary-400 mb-2">Misi</h5>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">{selectedCandidate.mission}</p>
                  </div>
                )}

                {/* Draft Link Button */}
                {selectedCandidate.draftLink ? (
                  <a
                    href={selectedCandidate.draftLink}
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
    </section>
  );
}
