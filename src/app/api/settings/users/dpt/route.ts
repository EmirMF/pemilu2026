import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import { isSuperAdminNim } from '@/lib/superAdmin';

export async function POST(request: Request) {
  try {
    // Verify admin session
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;

    if (!signedSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminNim = email.split('@')[0];
    const admin = await prisma.admin.findUnique({ where: { nim: adminNim } });

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!isSuperAdminNim(adminNim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat mengubah status DPT' }, { status: 403 });
    }

    const { nim, isInDPT } = await request.json();

    if (!nim || typeof isInDPT !== 'boolean') {
      return NextResponse.json({ error: 'NIM dan status DPT diperlukan' }, { status: 400 });
    }

    // Update voter entry
    await prisma.voter.update({
      where: { nim },
      data: { isInDPT }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating DPT status:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
