import HasilPemilihanClient from './HasilPemilihanClient'
import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'
import Navbar from '@/components/Navbar'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HasilPage() {
  const settings = await getElectionSettings()
  if (!settings.resultsPublished || settings.voteButtonState !== 'lihat hasil') {
    notFound()
  }

  const totalDPT = await prisma.voter.count({
    where: { isInDPT: true },
  })

  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { VoteRecords: true } } },
  })

  const visibleCandidates = candidates.filter((candidate) => !candidate.isHidden)
  const blankCandidates = candidates.filter((candidate) => candidate.isHidden)
  const blankVotes = candidates
    .filter((candidate) => candidate.isHidden)
    .reduce((sum, candidate) => sum + candidate._count.VoteRecords, 0)
  const blankPhoto = blankCandidates.find((candidate) => candidate.photo)?.photo ?? blankCandidates[0]?.photo ?? null

  const candidateRows = visibleCandidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    photo: candidate.photo,
    voteCount: candidate._count.VoteRecords,
    percentage: 0,
    isBlank: false,
    isWinner: false,
  }))

  const totalVotes = candidateRows.reduce((sum, row) => sum + row.voteCount, 0) + blankVotes
  const blankCard = {
    id: 'kotak-kosong',
    name: 'Kotak Kosong',
    photo: blankPhoto,
    voteCount: blankVotes,
    percentage: 0,
    isBlank: true,
    isWinner: false,
  }

  const rankedCards = [...candidateRows, blankCard]
    .map((card) => ({
      ...card,
      percentage: totalVotes === 0 ? 0 : (card.voteCount / totalVotes) * 100,
    }))
    .sort((a, b) => b.voteCount - a.voteCount)

  const topVotes = rankedCards[0]?.voteCount ?? 0
  const cards = rankedCards.map((card) => ({
    ...card,
    isWinner: card.voteCount > 0 && card.voteCount === topVotes,
  }))

  return (
    <>
      <Navbar />
      <HasilPemilihanClient
        published={true}
        publishedAt={settings.resultsPublishedAt?.toISOString() || null}
        cards={cards}
        totalVotes={totalVotes}
        totalDPT={totalDPT}
      />
    </>
  )
}
