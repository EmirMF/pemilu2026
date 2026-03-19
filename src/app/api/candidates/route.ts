import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { VoteRecords: true }
        }
      }
    });
    
    // Map the result so frontend still receives voteCount
    const mappedCandidates = candidates.map(candidate => ({
      ...candidate,
      voteCount: candidate._count.VoteRecords
    }));
    
    // Remove _count from objects before sending
    mappedCandidates.forEach(c => delete (c as any)._count);

    return NextResponse.json(mappedCandidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data kandidat.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, vision, mission, photo, draftLink } = body;

    if (!name || !vision) {
      return NextResponse.json({ error: 'Nama dan Visi wajib diisi.' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        vision,
        mission,
        photo,
        draftLink
      }
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat kandidat.' }, { status: 500 });
  }
}
