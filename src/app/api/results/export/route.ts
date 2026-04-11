import prisma from '@/lib/prisma'
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

  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { VoteRecords: true } } },
  })

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
    },
  })
}