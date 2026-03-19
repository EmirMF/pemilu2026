import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''

    const whereClause = search
      ? {
          nim: {
            contains: search,
          },
        }
      : {}

    const whitelists = await prisma.whitelist.findMany({
      where: whereClause,
      orderBy: { nim: 'asc' },
      select: {
        nim: true,
      },
    })

    return NextResponse.json({ whitelists })
  } catch (error) {
    console.error('Error fetching whitelist:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}