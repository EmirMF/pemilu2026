import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeAll = url.searchParams.get('includeAll') === '1';

    const voters = await prisma.voter.findMany({
      where: includeAll ? {} : { isInDPT: true },
      orderBy: { votedAt: 'desc' },
      select: {
        id: true,
        nim: true,
        email: true,
        hasVoted: true,
        votedAt: true,
        createdAt: true,
      }
    });

    return NextResponse.json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pemilih' },
      { status: 500 }
    );
  }
}
