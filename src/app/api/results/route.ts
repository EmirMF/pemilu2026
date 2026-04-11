import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'
import { getCacheOrSet } from '@/lib/cache'

function toInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const includeRecords = url.searchParams.get('includeRecords') === '1'
    const forceRealtime = url.searchParams.get('realtime') === '1' // Admin can force realtime
    const includeHidden = url.searchParams.get('includeHidden') === '1'
    const take = Math.min(toInt(url.searchParams.get('take'), 50), 200)
    const skip = Math.max(toInt(url.searchParams.get('skip'), 0), 0)

    // Cache key based on query params
    const cacheKey = `results:${forceRealtime ? 'realtime' : 'snapshot'}:${includeRecords}:${take}:${skip}:${includeHidden}`
    const cacheTTL = forceRealtime ? 5 : 30 // 5s for realtime, 30s for snapshot

    const result = await getCacheOrSet(
      cacheKey,
      async () => {
        // Count based on isInDPT (eligible voters / DPT)
        const [settings, totalDPT, totalVoted] = await Promise.all([
          getElectionSettings(),
          prisma.voter.count({ where: { isInDPT: true } }),
          prisma.voter.count({ where: { hasVoted: true, isInDPT: true } }),
        ])

        let mappedCandidates: Array<{
          id: string
          name: string
          vision: string
          mission: string | null
          photo: string | null
          draftLink: string | null
          isHidden: boolean
          voteCount: number
        }>
        let totalVotes: number
        let isSnapshot = false
        let lastVoteAt: string | null = null

        // Candidate filter based on includeHidden
        const candidateWhere = includeHidden ? {} : { isHidden: false }

        // If results are published and not forcing realtime, use snapshot
        if (settings.resultsPublished && !forceRealtime) {
          const publishedResults = await prisma.publishedResult.findMany({
            orderBy: { publishedAt: 'desc' },
          })

          // Get candidate details
          const candidates = await prisma.candidate.findMany({
            where: candidateWhere,
            orderBy: { id: 'asc' },
          })

          mappedCandidates = candidates.map((c) => {
            const published = publishedResults.find((p) => p.candidateId === c.id)
            return {
              id: c.id,
              name: c.name,
              vision: c.vision,
              mission: c.mission,
              major: c.major,
              photo: c.photo,
              draftLink: c.draftLink,
              isHidden: c.isHidden,
              voteCount: published?.voteCount ?? 0,
            }
          })

          totalVotes = publishedResults.reduce((acc, p) => acc + p.voteCount, 0)
          isSnapshot = true
          // Use publishedAt from the first published result as last update
          lastVoteAt = publishedResults[0]?.publishedAt.toISOString() || null
        } else {
          // Use realtime data
          const candidates = await prisma.candidate.findMany({
            where: candidateWhere,
            orderBy: { id: 'asc' },
            include: { _count: { select: { VoteRecords: true } } },
          })

          mappedCandidates = candidates.map((c) => ({
            id: c.id,
            name: c.name,
            vision: c.vision,
            mission: c.mission,
            major: c.major,
            photo: c.photo,
            draftLink: c.draftLink,
            isHidden: c.isHidden,
            voteCount: c._count.VoteRecords,
          }))

          totalVotes = mappedCandidates.reduce((acc, c) => acc + c.voteCount, 0)
          
          // Get last vote for real-time data
          const lastVote = await prisma.voteRecord.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          })
          lastVoteAt = lastVote?.createdAt.toISOString() || null
        }

        const turnoutPct = totalDPT === 0 ? 0 : (totalVoted / totalDPT) * 100

        const candidatesWithPct = mappedCandidates.map((c) => ({
          ...c,
          percentage: totalVotes === 0 ? 0 : (c.voteCount / totalVotes) * 100,
        }))

        let records: Array<{
          id: string
          createdAt: string
          candidateId: string
          candidateName: string
        }> | null = null

        if (includeRecords) {
          const voteRecords = await prisma.voteRecord.findMany({
            orderBy: { createdAt: 'desc' },
            take,
            skip,
            include: { candidate: { select: { id: true, name: true } } },
          })

          records = voteRecords.map((r) => ({
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            candidateId: r.candidateId,
            candidateName: r.candidate.name,
          }))
        }

        const voteButtonState = (settings as { voteButtonState?: string | null }).voteButtonState || 'default'

        // Helper to convert Date to ISO string safely
        const toISOString = (date: any) => {
          if (!date) return null
          if (typeof date === 'string') return date
          return date.toISOString()
        }

        return {
          election: {
            isOpen: settings.isOpen,
            updatedAt: toISOString(settings.updatedAt),
            countdownEnd: toISOString(settings.countdownEnd),
            countdownType: settings.countdownType || 'end',
            resultsPublished: settings.resultsPublished,
            resultsPublishedAt: toISOString(settings.resultsPublishedAt),
            showTotalVotes: settings.showTotalVotes ?? true,
            showVotingStatus: (settings as { showVotingStatus?: boolean }).showVotingStatus ?? true,
            showUserVoteStatus: (settings as { showUserVoteStatus?: boolean }).showUserVoteStatus ?? true,
            voteButtonState,
            lastVoteAt,
          },
          totals: { totalVotes, totalDPT, totalVoted, turnoutPct },
          candidates: candidatesWithPct,
          records,
          pagination: includeRecords ? { take, skip } : null,
          isSnapshot,
        }
      },
      { ttl: cacheTTL }
    )

    // Add cache headers
    const headers = new Headers()
    headers.set('Cache-Control', `public, s-maxage=${cacheTTL}, stale-while-revalidate=${cacheTTL * 2}`)
    
    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil hasil.' }, { status: 500 })
  }
}
