import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nim: true,
        email: true,
        hasVoted: true,
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
