import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'

export async function GET(request: Request) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const signedSession = cookieStore.get('voter_session')?.value

    if (!signedSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = verifyCookie(signedSession)
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const nim = email.split('@')[0]
    const admin = await prisma.admin.findUnique({ where: { nim } })

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const showUsed = url.searchParams.get('showUsed') === 'true'

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { nim: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (!showUsed) {
      whereClause.used = false
    }

    const otpLogs = await prisma.otpLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 entries
    })

    // Filter out expired OTPs
    const now = new Date()
    const validOtpLogs = otpLogs.map(log => ({
      ...log,
      isExpired: log.expiresAt < now,
    }))

    return NextResponse.json({ otpLogs: validOtpLogs })
  } catch (error) {
    console.error('Error fetching OTP logs:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

// Mark OTP as used
export async function PATCH(request: Request) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const signedSession = cookieStore.get('voter_session')?.value

    if (!signedSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = verifyCookie(signedSession)
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const nim = email.split('@')[0]
    const admin = await prisma.admin.findUnique({ where: { nim } })

    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { id } = await request.json()

    await prisma.otpLog.update({
      where: { id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating OTP log:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
