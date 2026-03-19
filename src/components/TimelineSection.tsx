'use client'

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TimelineEvent {
  date: string;
  title: string;
}

export default function TimelineSection() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    { date: '12 Okt 2026', title: 'Pendaftaran Kandidat' },
    { date: '20 Okt 2026', title: 'Masa Kampanye' },
    { date: '25 Okt 2026', title: 'Debat Terbuka' },
    { date: '1 Nov 2026', title: 'Hari Pemilihan (Voting)' },
    { date: '3 Nov 2026', title: 'Pengumuman Hasil' },
  ]);

  useEffect(() => {
    fetch('/api/settings/timeline')
      .then(res => res.json())
      .then(data => {
        if (data.timelineEvents && data.timelineEvents.length > 0) {
          setTimelineEvents(data.timelineEvents);
        }
      })
      .catch(err => console.error('Error fetching timeline:', err));
  }, []);

  return (
    <section className="py-24 text-neutral-900 dark:text-neutral-50 border-t border-neutral-200/30 dark:border-neutral-800/30 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-12 sm:mb-16 text-center">Timeline Pemilu</h2>
        
        <div className="flex justify-center">
          <div className="relative pl-6 sm:pl-8">
            {/* Vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-300 dark:bg-primary-700" />
            
            {timelineEvents.map((event, i) => (
              <motion.div
                key={i}
                className="mb-8 sm:mb-10 relative"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {/* Dot - positioned relative to the vertical line */}
                <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-secondary-500 dark:bg-secondary-400 rounded-full left-[-28px] sm:left-[-39px] top-1 border-2 sm:border-4 border-cream-50 dark:border-neutral-950" />
                <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 font-semibold mb-1">{event.date}</p>
                <h4 className="text-lg sm:text-xl font-bold">{event.title}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
