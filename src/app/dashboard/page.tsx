import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [settings, voters, dptVoters, publishedResults] = await Promise.all([
    getElectionSettings(),
    prisma.voter.findMany({
      select: { hasVoted: true },
    }),
    prisma.voter.findMany({
      where: { isInDPT: true },
      select: { hasVoted: true },
    }),
    prisma.publishedResult.findMany({
      orderBy: { publishedAt: 'desc' },
    }),
  ])

  // Get all candidates
  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' },
  })

  // Use published results if available, otherwise use real-time data
  let candidateRows
  let lastUpdate: string | null = null
  
  if (publishedResults.length > 0) {
    candidateRows = candidates.map((c) => {
      const published = publishedResults.find((p) => p.candidateId === c.id)
      return {
        id: c.id,
        name: c.name,
        voteCount: published?.voteCount ?? 0,
      }
    })
    // Use publishedAt from the first published result as last update
    lastUpdate = publishedResults[0]?.publishedAt.toISOString() || null
  } else {
    // Fallback to real-time if no snapshot
    const candidatesWithCounts = await prisma.candidate.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { VoteRecords: true } } },
    })
    candidateRows = candidatesWithCounts.map((c) => ({
      id: c.id,
      name: c.name,
      voteCount: c._count.VoteRecords,
    }))
    
    // Get last vote for real-time data
    const lastVote = await prisma.voteRecord.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    lastUpdate = lastVote?.createdAt.toISOString() || null
  }
  
  const totalVotes = candidateRows.reduce((acc, r) => acc + r.voteCount, 0)
  
  const voterStats = {
    total: voters.length,
    totalDPT: dptVoters.length,
    voted: dptVoters.filter(v => v.hasVoted).length,
    notVoted: dptVoters.filter(v => !v.hasVoted).length,
  }

  return (
    <DashboardClient 
      candidates={candidateRows} 
      totalVotes={totalVotes} 
      isOpen={settings.isOpen}
      voterStats={voterStats}
      lastUpdate={lastUpdate}
    />
  )
}
