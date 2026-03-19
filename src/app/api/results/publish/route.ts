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
    // Check admin authentication
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    // Get password from request body
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password diperlukan' }, { status: 400 })
    }

    // Get password from database
    const settings = await prisma.electionSettings.findUnique({
      where: { key: 'main' },
    })

    const storedPassword = (settings as any)?.publishPassword
    if (!storedPassword) {
      return NextResponse.json({ error: 'Password publikasi belum dikonfigurasi' }, { status: 500 })
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, storedPassword)
    if (!isValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    // Get current vote counts
    const candidates = await prisma.candidate.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { VoteRecords: true } } },
    })

    const totalVotes = candidates.reduce((acc, c) => acc + c._count.VoteRecords, 0)

    // Clear existing published results
    await prisma.publishedResult.deleteMany({})

    // Create snapshot of current results
    const publishedResults = candidates.map((c) => ({
      candidateId: c.id,
      name: c.name,
      voteCount: c._count.VoteRecords,
      percentage: totalVotes === 0 ? 0 : (c._count.VoteRecords / totalVotes) * 100,
      publishedAt: new Date(),
    }))

    await prisma.publishedResult.createMany({
      data: publishedResults,
    })

    // Update election settings
    await prisma.electionSettings.updateMany({
      where: { key: 'main' },
      data: {
        resultsPublished: true,
        resultsPublishedAt: new Date(),
      },
    })

    // Audit: results published
    await createAuditLog({
      action: 'RESULTS_PUBLISHED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      status: 'SUCCESS',
      details: {
        totalVotes,
        candidatesCount: candidates.length,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Hasil berhasil dipublikasikan',
      totalVotes,
      candidatesCount: candidates.length,
      publishedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error publishing results:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mempublikasikan hasil.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Check admin authentication
    const auth = await checkAdminAuth()
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    // Get password from request body
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password diperlukan' }, { status: 400 })
    }

    // Get password from database
    const settings = await prisma.electionSettings.findUnique({
      where: { key: 'main' },
    })

    const storedPassword = (settings as any)?.publishPassword
    if (!storedPassword) {
      return NextResponse.json({ error: 'Password publikasi belum dikonfigurasi' }, { status: 500 })
    }

    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, storedPassword)
    if (!isValid) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 })
    }

    // Clear published results
    await prisma.publishedResult.deleteMany({})

    // Update election settings
    await prisma.electionSettings.updateMany({
      where: { key: 'main' },
      data: {
        resultsPublished: false,
        resultsPublishedAt: null,
      },
    })

    // Audit: results unpublished
    await createAuditLog({
      action: 'RESULTS_UNPUBLISHED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      status: 'SUCCESS',
    })

    return NextResponse.json({
      success: true,
      message: 'Publikasi hasil dibatalkan',
    })
  } catch (error) {
    console.error('Error unpublishing results:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membatalkan publikasi.' },
      { status: 500 }
    )
  }
}
