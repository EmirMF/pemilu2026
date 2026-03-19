import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export async function GET() {
  const [settings, candidates] = await Promise.all([
    getElectionSettings(),
    prisma.candidate.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { VoteRecords: true } } },
    }),
  ])

  const rows = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    voteCount: c._count.VoteRecords,
  }))
  const totalVotes = rows.reduce((acc, r) => acc + r.voteCount, 0)

  const header = ['candidateId', 'candidateName', 'votes', 'percentage']
  const lines = [
    header.join(','),
    ...rows.map((r) => {
      const pct = totalVotes === 0 ? 0 : (r.voteCount / totalVotes) * 100
      return [
        csvEscape(r.id),
        csvEscape(r.name),
        String(r.voteCount),
        pct.toFixed(2),
      ].join(',')
    }),
  ]

  const csv = lines.join('\n')
  const now = new Date()
  const filename = `rekap-hasil-pemilihan-${now.toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Election-Open': settings.isOpen ? '1' : '0',
    },
  })
}

