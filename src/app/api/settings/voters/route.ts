import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';

function getAngkatanFromNim(nim: string): number | null {
  if (nim.length < 5) return null;

  const base = Number.parseInt(nim.slice(3, 5), 10);
  if (Number.isNaN(base)) return null;

  return base + 6;
}

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(request.url);
    const includeAll = url.searchParams.get('includeAll') === '1';

    const voters = await prisma.voter.findMany({
      where: includeAll ? {} : { isInDPT: true },
      orderBy: { votedAt: 'desc' },
      select: {
        id: true,
        nim: true,
        name: true,
        email: true,
        hasVoted: true,
        votedAt: true,
        createdAt: true,
      }
    });

    const votersWithAngkatan = voters.map((voter) => ({
      ...voter,
      angkatan: getAngkatanFromNim(voter.nim),
    }));

    return NextResponse.json(votersWithAngkatan);
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pemilih' },
      { status: 500 }
    );
  }
}
