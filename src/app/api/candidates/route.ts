import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCacheOrSet, deleteCache } from '@/lib/cache';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createAuditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    const candidates = await getCacheOrSet(
      'candidates:list:public',
      async () => {
        const candidates = await prisma.candidate.findMany({
          where: { isHidden: false },
          orderBy: { id: 'asc' },
        });
        
        return candidates;
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
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, tagline, vision, mission, major, photo, draftLink, isHidden } = body;

    if (!name || !vision) {
      return NextResponse.json({ error: 'Nama dan Visi wajib diisi.' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        tagline,
        vision,
        mission,
        major,
        photo,
        draftLink,
        isHidden: isHidden || false
      }
    });

    await deleteCache('candidates:list');

    await createAuditLog({
      action: 'CANDIDATE_CREATED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: candidate.id,
      targetType: 'CANDIDATE',
      status: 'SUCCESS',
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat kandidat.' }, { status: 500 });
  }
}
