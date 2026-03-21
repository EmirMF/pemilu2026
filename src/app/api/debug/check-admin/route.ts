import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Debug endpoint to check admin status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get('nim');

    if (!nim) {
      return NextResponse.json({ error: 'NIM required' }, { status: 400 });
    }

    // Check admin
    const admin = await prisma.admin.findUnique({ where: { nim } });
    
    // Check voter
    const voter = await prisma.voter.findUnique({ where: { nim } });

    return NextResponse.json({
      nim,
      isAdmin: !!admin,
      hasVoted: voter?.hasVoted || false,
      isInDPT: voter?.isInDPT || false,
      adminData: admin,
      voterData: voter
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Error checking status', details: String(error) },
      { status: 500 }
    );
  }
}
