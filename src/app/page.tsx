"use client";

import Grainient from '@/components/Grainient';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CandidateSection from '@/components/CandidateSection';
import CountdownSection from '@/components/CountdownSection';
import TimelineSection from '@/components/TimelineSection';
import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

type ResultCandidate = {
  id: string
  name: string
  vision: string
  mission: string | null
  major?: string | null
  photo: string | null
  draftLink: string | null
}

type ResultsResponse = {
  election: {
    isOpen: boolean
    countdownEnd: string | null
    countdownType: string | null
    voteButtonState: 'default' | 'before' | 'hidden'
  }
  candidates: Array<ResultCandidate>
}

export default function LandingPage() {
  const [electionIsOpen, setElectionIsOpen] = useState<boolean | null>(null)
  const [countdownEnd, setCountdownEnd] = useState<string | null>(null)
  const [countdownType, setCountdownType] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<ResultCandidate[]>([])
  const [voteButtonState, setVoteButtonState] = useState<'default' | 'before' | 'hidden'>('default')
  
  let theme = 'light'
  try {
    const themeContext = useTheme()
    theme = themeContext.theme
  } catch {
  }

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/results', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as ResultsResponse
        setElectionIsOpen(json.election.isOpen)
        setCountdownEnd(json.election.countdownEnd)
        setCountdownType(json.election.countdownType)
        setVoteButtonState(json.election.voteButtonState ?? 'default')
        setCandidates(
          (json.candidates ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            vision: c.vision,
            mission: c.mission,
            major: c.major,
            photo: c.photo,
            draftLink: c.draftLink,
          })),
        )
      } catch {
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
          timeSpeed={0.7}
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
        voteButtonState={voteButtonState}
      />
      <CandidateSection candidates={candidates} />
      <CountdownSection countdownEnd={countdownEnd} countdownType={countdownType} />
      <TimelineSection />
    </main>
    </>
  );
}
