import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'
import prisma from '@/lib/prisma'
import { getAuditLogs, getAuditStats } from '@/lib/auditLog'

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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || undefined
    const actorNim = url.searchParams.get('actorNim') || undefined
    const status = url.searchParams.get('status') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const skip = parseInt(url.searchParams.get('skip') || '0')
    const getStats = url.searchParams.get('stats') === 'true'

    // Get date range if provided
    const startDateStr = url.searchParams.get('startDate')
    const endDateStr = url.searchParams.get('endDate')
    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    if (getStats) {
      const stats = await getAuditStats(startDate, endDate)
      return NextResponse.json(stats)
    }

    const result = await getAuditLogs({
      action: action as any,
      actorNim,
      status: status as any,
      startDate,
      endDate,
      limit,
      skip,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
