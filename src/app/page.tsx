"use client";

import Grainient from '@/components/Grainient';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CandidateSection from '@/components/CandidateSection';
import ResultsSection from '@/components/ResultsSection';
import CountdownSection from '@/components/CountdownSection';
import TimelineSection from '@/components/TimelineSection';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

type ResultCandidate = {
  id: string
  name: string
  vision: string
  mission: string | null
  photo: string | null
  draftLink: string | null
}

type ResultsResponse = {
  election: {
    isOpen: boolean
    updatedAt: string
    countdownEnd: string | null
    countdownType: string | null
    resultsPublished: boolean
    resultsPublishedAt: string | null
    showTotalVotes: boolean
    showVotingStatus: boolean
    showUserVoteStatus: boolean
    voteButtonState: 'default' | 'before' | 'after' | 'hidden'
  }
  totals: { totalVotes: number }
  candidates: Array<ResultCandidate & { voteCount: number; percentage: number }>
  isSnapshot: boolean
}

export default function LandingPage() {
  const [electionIsOpen, setElectionIsOpen] = useState<boolean | null>(null)
  const [totalVotes, setTotalVotes] = useState<number | null>(null)
  const [countdownEnd, setCountdownEnd] = useState<string | null>(null)
  const [countdownType, setCountdownType] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<ResultCandidate[]>([])
  const [isSnapshot, setIsSnapshot] = useState(false)
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [showTotalVotes, setShowTotalVotes] = useState(true)
  const [showVotingStatus, setShowVotingStatus] = useState(true)
  const [showUserVoteStatus, setShowUserVoteStatus] = useState(true)
  const [voteButtonState, setVoteButtonState] = useState<'default' | 'before' | 'after' | 'hidden'>('default')
  
  // Get theme
  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
    // Not in ThemeProvider
  }

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/results', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as ResultsResponse
        setElectionIsOpen(json.election.isOpen)
        setTotalVotes(json.totals.totalVotes)
        setCountdownEnd(json.election.countdownEnd)
        setCountdownType(json.election.countdownType)
        setIsSnapshot(json.isSnapshot || false)
        setPublishedAt(json.election.resultsPublishedAt)
        setShowTotalVotes(json.election.showTotalVotes ?? true)
        setShowVotingStatus(json.election.showVotingStatus ?? true)
        setShowUserVoteStatus(json.election.showUserVoteStatus ?? true)
        setVoteButtonState(json.election.voteButtonState ?? 'default')
        setCandidates(
          (json.candidates ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            vision: c.vision,
            mission: c.mission,
            photo: c.photo,
            draftLink: c.draftLink,
          })),
        )
      } catch {
        // keep landing page usable even if API fails
      }
    }
    void run()
  }, [])

  return (
    <>
      {/* Grainient Background - Fixed Full Screen */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        <Grainient
          color1={theme === 'dark' ? "#1a1a1a" : "#DB907F"}
          color2={theme === 'dark' ? "#402121" : "#FFDE7A"}
          color3={theme === 'dark' ? "#574316" : "#f0dcda"}
          timeSpeed={1.2}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={4}
          warpSpeed={1.5}
          warpAmplitude={40}
          blendAngle={0}
          blendSoftness={0.1}
          rotationAmount={300}
          noiseScale={2}
          grainAmount={theme === 'dark' ? 0.08 : 0.15}
          grainScale={2}
          grainAnimated={false}
          contrast={1.3}
          gamma={1}
          saturation={1.1}
          centerX={0}
          centerY={0}
          zoom={0.8}
        />
      </div>
      <main className="min-h-screen relative" style={{ zIndex: 1 }}>
      <Navbar />
      <HeroSection
        electionIsOpen={electionIsOpen}
        totalVotes={totalVotes}
        isSnapshot={isSnapshot}
        publishedAt={publishedAt}
        showTotalVotes={showTotalVotes}
        showVotingStatus={showVotingStatus}
        showUserVoteStatus={showUserVoteStatus}
        voteButtonState={voteButtonState}
      />
      {voteButtonState === 'after' ? (
        <ResultsSection />
      ) : (
        <>
          <CandidateSection candidates={candidates} />
          <CountdownSection countdownEnd={countdownEnd} countdownType={countdownType} />
        </>
      )}
      <TimelineSection />
    </main>
    </>
  );
}
