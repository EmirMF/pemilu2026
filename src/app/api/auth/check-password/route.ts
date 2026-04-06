import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });
    }

    // Check if email is valid ITB format
    if (!email.endsWith('@mahasiswa.itb.ac.id') && !email.endsWith('@itb.ac.id')) {
      return NextResponse.json({ error: 'Email harus menggunakan domain @mahasiswa.itb.ac.id atau @itb.ac.id' }, { status: 400 });
    }

    const nim = email.split('@')[0];

    // Rate limit: 10 requests per minute per NIM
    const rateLimitResult = await rateLimit(`check-auth:${nim}`, {
      interval: 60,
      maxRequests: 10
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    // Check voter exists
    const voter = await prisma.voter.findUnique({
      where: { nim }
    });

    if (!voter) {
      return NextResponse.json({ error: 'NIM tidak terdaftar' }, { status: 403 });
    }

    // Check in Admin table
    const admin = await prisma.admin.findUnique({
      where: { nim }
    });

    const isAdmin = !!admin;

    return NextResponse.json({
      isAdmin,
      hasVoted: voter.hasVoted
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
