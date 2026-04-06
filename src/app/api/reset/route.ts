import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'
import { createAuditLog } from '@/lib/auditLog'
import bcrypt from 'bcryptjs'

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
    console.error('Admin check error:', error)
    return { isAdmin: false, error: 'Admin check failed' }
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password, resetType } = body

    if (!password) {
      return NextResponse.json({ error: 'Password diperlukan' }, { status: 400 })
    }

    const settings = await prisma.electionSettings.findUnique({
      where: { key: 'main' },
    })

    const storedPassword = (settings as any)?.publishPassword
    if (!storedPassword) {
      return NextResponse.json({ error: 'Password publikasi belum dikonfigurasi' }, { status: 500 })
    }

    const isValid = await bcrypt.compare(password, storedPassword)
    if (!isValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    let resetResult = {}

    if (resetType === 'voters' || resetType === 'all') {
      const voterReset = await prisma.voter.updateMany({
        data: {
          hasVoted: false,
          votedAt: null,
        },
      })
      resetResult = { votersReset: voterReset.count }
    }

    if (resetType === 'votes' || resetType === 'all') {
      const votesDelete = await prisma.voteRecord.deleteMany({})
      resetResult = { ...resetResult, votesDeleted: votesDelete.count }
    }

    if (resetType === 'results' || resetType === 'all') {
      await prisma.publishedResult.deleteMany({})
      await prisma.electionSettings.updateMany({
        where: { key: 'main' },
        data: {
          resultsPublished: false,
          resultsPublishedAt: null,
        },
      })
      resetResult = { ...resetResult, resultsCleared: true }
    }

    await createAuditLog({
      action: 'RESET_ELECTION',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      status: 'SUCCESS',
      details: { resetType },
    })

    return NextResponse.json({
      success: true,
      message: `Reset berhasil untuk: ${resetType}`,
      ...resetResult,
    })
  } catch (error) {
    console.error('Error resetting election:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mereset data.' },
      { status: 500 }
    )
  }
}
