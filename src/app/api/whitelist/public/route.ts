import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''

    const whereClause: any = {
      isInDPT: true, // Only show users who are in DPT
    }

    if (search) {
      // Search by NIM or name
      whereClause.OR = [
        {
          nim: {
            contains: search,
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const voters = await prisma.voter.findMany({
      where: whereClause,
      orderBy: { nim: 'asc' },
      select: {
        nim: true,
        name: true,
      },
    })

    return NextResponse.json({ voters })
  } catch (error) {
    console.error('Error fetching voters:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}