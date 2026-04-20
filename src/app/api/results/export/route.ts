import prisma from '@/lib/prisma'
import { getElectionSettings } from '@/lib/election'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const signedSession = cookieStore.get('voter_session')?.value

  if (!signedSession) {
    return { isAdmin: false, error: 'No session found' }
  }

  const email = verifyCookie(signedSession)
  if (!email) {
    return { isAdmin: false, error: 'Invalid session' }
  }

  const nim = email.split('@')[0]
  
  try {
    const admin = await prisma.admin.findUnique({ where: { nim } })
    if (!admin) {
      return { isAdmin: false, error: 'Not an admin' }
    }
    return { isAdmin: true, nim, email }
  } catch (error) {
    return { isAdmin: false, error: 'Admin check failed' }
  }
}

export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return new Response('Unauthorized', { status: 401 })
  }

  const settings = await getElectionSettings()

  let resolvedRows: Array<{ id: string; name: string; voteCount: number }>
  if (settings.resultsPublished) {
    const publishedResults = await prisma.publishedResult.findMany({ orderBy: { voteCount: 'desc' } })
    const candidates = await prisma.candidate.findMany({ orderBy: { id: 'asc' } })

    resolvedRows = candidates.map((c) => {
      const published = publishedResults.find((p) => p.candidateId === c.id)
      return {
        id: c.id,
        name: c.name,
        voteCount: published?.voteCount ?? 0,
      }
    })
  } else {
    const candidates = await prisma.candidate.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { VoteRecords: true } } },
    })

    resolvedRows = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      voteCount: c._count.VoteRecords,
    }))
  }

  const totalVotes = resolvedRows.reduce((acc, r) => acc + r.voteCount, 0)

  const voteRecords = await prisma.voteRecord.findMany({
    orderBy: { createdAt: 'desc' },
    include: { candidate: { select: { id: true, name: true } } },
  })

  const header = ['rowType', 'candidateId', 'candidateName', 'votes', 'percentage', 'recordId', 'recordCreatedAt']
  const lines = [
    header.join(','),
    ...resolvedRows.map((r) => {
      const pct = totalVotes === 0 ? 0 : (r.voteCount / totalVotes) * 100
      return [
        'candidate',
        csvEscape(r.id),
        csvEscape(r.name),
        String(r.voteCount),
        pct.toFixed(2),
        '',
        '',
      ].join(',')
    }),
    ...voteRecords.map((record) =>
      [
        'record',
        csvEscape(record.candidateId),
        csvEscape(record.candidate.name),
        '',
        '',
        csvEscape(record.id),
        csvEscape(record.createdAt.toISOString()),
      ].join(','),
    ),
  ]

  const csv = lines.join('\n')
  const now = new Date()
  const filename = `rekap-hasil-pemilihan-${now.toISOString().slice(0, 10)}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}