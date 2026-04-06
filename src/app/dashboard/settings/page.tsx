'use client';

import { useState, useEffect } from 'react';
import ElectionStatusSettings from './ElectionStatusSettings';
import GradientSettings from './GradientSettings';
import SetPasswordCard from './SetPasswordCard';
import ResultsPublishSettings from './ResultsPublishSettings';
import TimelineSettings from './TimelineSettings';
import PublishPasswordSettings from './PublishPasswordSettings';
import BadgeVisibilitySettings from './BadgeVisibilitySettings';
import ResetElectionSettings from './ResetElectionSettings';

interface AccordionItemProps {
  title: string;
  description: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, description, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">{description}</p>
        </div>
        <svg
          className={`w-6 h-6 text-neutral-500 dark:text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-neutral-100 dark:border-neutral-700">
          <div className="pt-6">{children}</div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [openSection, setOpenSection] = useState<string | null>('password');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is super admin (18224066)
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          const nim = data.email.split('@')[0];
          setIsSuperAdmin(nim === '18224066');
        }
      })
      .catch(err => console.error('Error checking session:', err));
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Pengaturan Sistem</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Kelola konfigurasi sistem pemilihan.</p>
      </div>

      <div className="space-y-4">
        <AccordionItem
          title="Password Admin"
          description="Ubah password untuk login admin"
          isOpen={openSection === 'password'}
          onToggle={() => toggleSection('password')}
        >
          <SetPasswordCard />
        </AccordionItem>

        {isSuperAdmin && (
          <AccordionItem
            title="Password Sistem"
            description="Atur password sistem untuk operasi sensitif (hanya super admin)"
            isOpen={openSection === 'publishPassword'}
            onToggle={() => toggleSection('publishPassword')}
          >
            <PublishPasswordSettings />
          </AccordionItem>
        )}

        <AccordionItem
          title="Status Pemilihan"
          description="Atur apakah pemilihan sedang berlangsung atau ditutup"
          isOpen={openSection === 'election'}
          onToggle={() => toggleSection('election')}
        >
          <ElectionStatusSettings />
        </AccordionItem>

        <AccordionItem
          title="Publikasi Hasil"
          description="Kontrol kapan hasil ditampilkan di landing page"
          isOpen={openSection === 'results'}
          onToggle={() => toggleSection('results')}
        >
          <ResultsPublishSettings />
        </AccordionItem>

        <AccordionItem
          title="Visibilitas Badge"
          description="Atur tampilan badge status voting dan status vote user"
          isOpen={openSection === 'badges'}
          onToggle={() => toggleSection('badges')}
        >
          <BadgeVisibilitySettings />
        </AccordionItem>

        <AccordionItem
          title="Timeline Pemilu"
          description="Atur event-event penting dalam timeline pemilihan"
          isOpen={openSection === 'timeline'}
          onToggle={() => toggleSection('timeline')}
        >
          <TimelineSettings />
        </AccordionItem>

        <AccordionItem
          title="Background Gradient"
          description="Atur warna gradient untuk background halaman"
          isOpen={openSection === 'gradient'}
          onToggle={() => toggleSection('gradient')}
        >
          <GradientSettings />
        </AccordionItem>

        <AccordionItem
          title="Reset Pemilihan"
          description="Reset data pemilihan (status voters, suara, publikasi hasil)"
          isOpen={openSection === 'reset'}
          onToggle={() => toggleSection('reset')}
        >
          <ResetElectionSettings />
        </AccordionItem>
      </div>
    </div>
  );
}
