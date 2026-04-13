import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'

function toInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

async function checkAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const signedSession = cookieStore.get('voter_session')?.value
  if (!signedSession) return false
  const email = verifyCookie(signedSession)
  if (!email) return false
  const nim = email.split('@')[0]
  const admin = await prisma.admin.findUnique({ where: { nim } })
  return !!admin
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const isAdmin = await checkAdmin()
    const forceRealtime = isAdmin && url.searchParams.get('realtime') === '1'
    const includeHidden = isAdmin && url.searchParams.get('includeHidden') === '1'
    const includeRecords = isAdmin && url.searchParams.get('includeRecords') === '1'
    const take = Math.min(toInt(url.searchParams.get('take'), 50), 200)
    const skip = Math.max(toInt(url.searchParams.get('skip'), 0), 0)

    const settings = await getElectionSettings()
    const candidateWhere = includeHidden ? {} : { isHidden: false }

    // If results are published, use snapshot data instead of real-time
    if (settings.resultsPublished && !forceRealtime) {
      const publishedResults = await prisma.publishedResult.findMany({
        orderBy: { voteCount: 'desc' },
      })
      
      const totalVotes = publishedResults.reduce((acc, p) => acc + p.voteCount, 0)
      
      // Get candidate details for published results
      const candidates = await prisma.candidate.findMany({
        where: candidateWhere,
        orderBy: { id: 'asc' },
      })
      
      const candidatesData = candidates.map(c => {
        const published = publishedResults.find(p => p.candidateId === c.id)
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
          percentage: totalVotes === 0 ? 0 : ((published?.voteCount ?? 0) / totalVotes) * 100,
        }
      })

      // Get DPT stats for totals
      const totalDPT = await prisma.voter.count({ where: { isInDPT: true } })
      const totalVoted = await prisma.voter.count({ where: { hasVoted: true, isInDPT: true } })

      return NextResponse.json({
        election: {
          isOpen: settings.isOpen,
          countdownEnd: settings.countdownEnd?.toISOString(),
          countdownType: settings.countdownType,
          voteButtonState: settings.voteButtonState || 'default',
          resultsPublished: settings.resultsPublished,
          resultsPublishedAt: settings.resultsPublishedAt?.toISOString() || null,
        },
        totals: { totalVotes, totalDPT, totalVoted, turnoutPct: totalDPT === 0 ? 0 : (totalVoted / totalDPT) * 100 },
        candidates: candidatesData,
        isSnapshot: true,
        snapshotAt: settings.resultsPublishedAt?.toISOString() || null,
      })
    }

    // Admin + realtime = full data (bypass snapshot)
    if (isAdmin && forceRealtime) {
      const totalDPT = await prisma.voter.count({ where: { isInDPT: true } })
      const totalVoted = await prisma.voter.count({ where: { hasVoted: true, isInDPT: true } })
      
      const candidates = await prisma.candidate.findMany({
        where: candidateWhere,
        orderBy: { id: 'asc' },
        include: { _count: { select: { VoteRecords: true } } },
      })
      const totalVotes = candidates.reduce((acc, c) => acc + c._count.VoteRecords, 0)

      const candidatesData = candidates.map(c => ({
        id: c.id,
        name: c.name,
        vision: c.vision,
        mission: c.mission,
        major: c.major,
        photo: c.photo,
        draftLink: c.draftLink,
        isHidden: c.isHidden,
        voteCount: c._count.VoteRecords,
        percentage: totalVotes === 0 ? 0 : (c._count.VoteRecords / totalVotes) * 100,
      }))

      const lastVote = await prisma.voteRecord.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })

      let records = null
      if (includeRecords) {
        const vr = await prisma.voteRecord.findMany({
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          include: { candidate: { select: { id: true, name: true } } },
        })
        records = vr.map(r => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          candidateId: r.candidateId,
          candidateName: r.candidate.name,
        }))
      }

      return NextResponse.json({
        election: {
          isOpen: settings.isOpen,
          updatedAt: settings.updatedAt?.toISOString(),
          lastVoteAt: lastVote?.createdAt.toISOString() || null,
          countdownEnd: settings.countdownEnd?.toISOString(),
          countdownType: settings.countdownType,
          resultsPublished: settings.resultsPublished,
          resultsPublishedAt: settings.resultsPublishedAt?.toISOString() || null,
        },
        totals: { totalVotes, totalDPT, totalVoted, turnoutPct: totalDPT === 0 ? 0 : (totalVoted / totalDPT) * 100 },
        candidates: candidatesData,
        records,
        pagination: includeRecords ? { take, skip } : null,
      })
    }

    // Everyone else gets clean data (no vote counts)
    const candidates = await prisma.candidate.findMany({
      where: candidateWhere,
      orderBy: { id: 'asc' },
    })

    const candidatesData = candidates.map(c => ({
      id: c.id,
      name: c.name,
      vision: c.vision,
      mission: c.mission,
      major: c.major,
      photo: c.photo,
      draftLink: c.draftLink,
      isHidden: c.isHidden,
    }))

    return NextResponse.json({
      election: {
        isOpen: settings.isOpen,
        countdownEnd: settings.countdownEnd?.toISOString(),
        countdownType: settings.countdownType,
        voteButtonState: settings.voteButtonState || 'default',
        resultsPublished: settings.resultsPublished,
        resultsPublishedAt: settings.resultsPublishedAt?.toISOString() || null,
      },
      totals: null,
      candidates: candidatesData,
    })
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil hasil.' }, { status: 500 })
  }
}