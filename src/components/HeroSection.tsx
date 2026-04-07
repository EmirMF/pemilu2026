  'use client'

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Button from './ui/Button';
import ShinyText from './ShinyText';

type VoteButtonState = 'default' | 'before' | 'after' | 'hidden'

export default function HeroSection({
  electionIsOpen,
  totalVotes,
  isSnapshot,
  publishedAt,
  showTotalVotes = true,
  showVotingStatus = true,
  showUserVoteStatus = true,
  voteButtonState = 'default',
}: {
  electionIsOpen: boolean | null
  totalVotes: number | null
  isSnapshot?: boolean
  publishedAt?: string | null
  showTotalVotes?: boolean
  showVotingStatus?: boolean
  showUserVoteStatus?: boolean
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

    if (voteButtonState === 'after') {
      return {
        label: 'Lihat Hasil',
        onClick: scrollToResults,
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
      <div className="md:hidden fixed inset-0 z-0 flex pointer-events-none justify-center items-end">
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

        {!isLoading && (showVotingStatus || (showUserVoteStatus && isAuthenticated) || showTotalVotes) && (
          <motion.div
            className="flex items-center justify-center gap-3 mb-8 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {showVotingStatus && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  electionIsOpen === null
                    ? 'bg-cream-200 dark:bg-cream-800 text-neutral-700 dark:text-neutral-300 border-cream-400 dark:border-cream-600'
                    : electionIsOpen
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-400 dark:border-neutral-600'
                }`}
              >
                {electionIsOpen === null ? 'Status: Memuat…' : electionIsOpen ? 'Status: Voting Dibuka' : 'Status: Voting Ditutup'}
              </span>
            )}
            {showUserVoteStatus && isAuthenticated && hasVoted !== null && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  hasVoted
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
                }`}
              >
                {hasVoted ? 'Anda sudah vote' : 'Anda belum vote'}
              </span>
            )}
            {showTotalVotes && (
              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-cream-200 dark:bg-cream-800 text-neutral-700 dark:text-neutral-300 border-cream-400 dark:border-cream-600">
                Total suara: {totalVotes === null ? '…' : totalVotes}
                {isSnapshot && publishedAt && (
                  <span className="text-xs ml-1 opacity-75">
                    (Updated {new Date(publishedAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                )}
              </span>
            )}
          </motion.div>
        )}

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
