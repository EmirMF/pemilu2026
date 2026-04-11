  'use client'

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Button from './ui/Button';
import ShinyText from './ShinyText';

type VoteButtonState = 'default' | 'before' | 'hidden'

export default function HeroSection({
  electionIsOpen,
  voteButtonState = 'default',
}: {
  electionIsOpen: boolean | null
  voteButtonState?: VoteButtonState
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated and if they have voted
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.authenticated || false);
        setHasVoted(data.hasVoted || false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setHasVoted(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleVoteClick = () => {
    // If authenticated, go to vote page, otherwise go to login
    window.location.href = isAuthenticated ? '/vote' : '/login';
  };

  const scrollToResults = () => {
    const target = document.getElementById('results')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.hash = 'results'
  }

  const scrollToCandidates = () => {
    const target = document.getElementById('candidates')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.hash = 'candidates'
  }

  const ctaConfig = (() => {
    if (voteButtonState === 'hidden') return null

    if (voteButtonState === 'before') {
      return {
        label: 'Kenali Calonmu',
        onClick: scrollToCandidates,
        disabled: false,
      }
    }

    return {
      label: isAuthenticated ? 'Vote Sekarang' : 'Login untuk Vote',
      onClick: handleVoteClick,
      disabled: electionIsOpen === false,
    }
  })()

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center text-neutral-900 dark:text-neutral-50 overflow-hidden">
      <div className="fixed bottom-0 left-0 right-0 z-0 md:flex md:items-center md:justify-center hidden">
        <img 
          src="/radio-home.png" 
          alt="" 
          className="w-3/4 h-auto object-contain opacity-20 dark:opacity-10 md:scale-100 scale-150"
        />
      </div>
      <div className="md:hidden absolute inset-0 z-0 flex pointer-events-none justify-center items-end">
        <img 
          src="/radio-home.png" 
          alt="" 
          className="w-full h-auto object-contain opacity-20 dark:opacity-10 scale-100"
        />
      </div>
      <div className="relative z-10 text-center max-w-4xl px-4">
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Pemilu 2026<br />
          <ShinyText
          text="8EH RADIO ITB"
          speed={2}
          delay={0}
          color="#E03A1F"
          shineColor="#F59D90"
          spread={120}
          direction="left"
          yoyo={false}
          pauseOnHover={false}
          disabled={false}
        />
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-neutral-700 dark:text-neutral-300 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
Pemilihan Umum General Manager 8EH Radio ITB 2026/2027
        </motion.p>

        {/* Badges removed */}

        {ctaConfig && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              onClick={ctaConfig.onClick}
              disabled={ctaConfig.disabled}
              className="text-md font-semibold! px-8 py-4 shadow-xl shadow-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full! bg-linear-to-r from-red-500 to-secondary-600 text-white hover:from-secondary-500 hover:to-secondary-800 transition-colors duration-300"
            >
              {ctaConfig.label}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
