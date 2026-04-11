import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';

// Debug endpoint to check admin status - admin only
export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nim = searchParams.get('nim');

    if (!nim) {
      return NextResponse.json({ error: 'NIM required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { nim } });
    const voter = await prisma.voter.findUnique({ where: { nim } });

    return NextResponse.json({
      nim,
      isAdmin: !!admin,
      hasVoted: voter?.hasVoted || false,
      isInDPT: voter?.isInDPT || false,
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Error checking status' },
      { status: 500 }
    );
  }
}
