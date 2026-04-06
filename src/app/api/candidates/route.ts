import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCacheOrSet, deleteCache } from '@/lib/cache';

export async function GET() {
  try {
    const candidates = await getCacheOrSet(
      'candidates:list',
      async () => {
        const candidates = await prisma.candidate.findMany({
          orderBy: { id: 'asc' },
          include: {
            _count: {
              select: { VoteRecords: true }
            }
          }
        });
        
        const mappedCandidates = candidates.map(candidate => ({
          ...candidate,
          voteCount: candidate._count.VoteRecords
        }));
        
        mappedCandidates.forEach(c => delete (c as any)._count);
        
        return mappedCandidates;
      },
      { ttl: 60 }
    );

    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return NextResponse.json(candidates, { headers });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data kandidat.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, vision, mission, photo, draftLink, isHidden } = body;

    if (!name || !vision) {
      return NextResponse.json({ error: 'Nama dan Visi wajib diisi.' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        vision,
        mission,
        photo,
        draftLink,
        isHidden: isHidden || false
      }
    });

    await deleteCache('candidates:list');

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat kandidat.' }, { status: 500 });
  }
}
