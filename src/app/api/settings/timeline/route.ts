import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const signedSession = cookieStore.get('voter_session')?.value;

  if (!signedSession) {
    return { isAdmin: false, error: 'No session found' };
  }

  const email = verifyCookie(signedSession);
  if (!email) {
    return { isAdmin: false, error: 'Invalid session' };
  }

  const nim = email.split('@')[0];
  
  try {
    const admin = await prisma.admin.findUnique({ where: { nim } });
    if (!admin) {
      return { isAdmin: false, error: 'Not an admin' };
    }
    return { isAdmin: true, nim, email };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, error: 'Admin check failed' };
  }
}

export async function GET() {
  try {
    const settings = await prisma.electionSettings.findUnique({
      where: { key: 'main' },
    });

    const timelineEvents = (settings as any)?.timelineEvents
      ? JSON.parse((settings as any).timelineEvents)
      : [
          { date: '12 Okt 2026', title: 'Pendaftaran Kandidat' },
          { date: '20 Okt 2026', title: 'Masa Kampanye' },
          { date: '25 Okt 2026', title: 'Debat Terbuka' },
          { date: '1 Nov 2026', title: 'Hari Pemilihan (Voting)' },
          { date: '3 Nov 2026', title: 'Pengumuman Hasil' },
        ];

    return NextResponse.json({ timelineEvents });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { timelineEvents } = await request.json();

    if (!Array.isArray(timelineEvents)) {
      return NextResponse.json(
        { error: 'Invalid timeline format' },
        { status: 400 }
      );
    }

    // Validate each event has date and title
    for (const event of timelineEvents) {
      if (!event.date || !event.title) {
        return NextResponse.json(
          { error: 'Each event must have date and title' },
          { status: 400 }
        );
      }
    }

    const settings = await prisma.electionSettings.upsert({
      where: { key: 'main' },
      update: {
        timelineEvents: JSON.stringify(timelineEvents),
      },
      create: {
        key: 'main',
        timelineEvents: JSON.stringify(timelineEvents),
      },
    });

    await createAuditLog({
      action: 'SETTINGS_GRADIENT_CHANGED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetType: 'TIMELINE',
      details: { timelineEvents },
      status: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      timelineEvents: JSON.parse((settings as any).timelineEvents || '[]')
    });
  } catch (error) {
    console.error('Error updating timeline:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline' },
      { status: 500 }
    );
  }
}
