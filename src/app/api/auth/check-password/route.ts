import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 });
    }

    // Check if email is valid ITB format
    if (!email.endsWith('@mahasiswa.itb.ac.id')) {
      return NextResponse.json({ error: 'Email harus menggunakan domain @mahasiswa.itb.ac.id' }, { status: 400 });
    }

    const nim = email.split('@')[0];

    // Rate limit: 10 requests per minute per NIM
    const rateLimitResult = await rateLimit(`check-password:${nim}`, {
      interval: 60,
      maxRequests: 10
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    // Check whitelist first
    const whitelistEntry = await prisma.whitelist.findUnique({
      where: { nim }
    });

    if (!whitelistEntry) {
      return NextResponse.json({ error: 'NIM tidak terdaftar dalam whitelist' }, { status: 403 });
    }

    // Check in Voter table
    const voter = await prisma.voter.findUnique({
      where: { email }
    });

    // Check in Admin table
    const admin = await prisma.admin.findUnique({
      where: { nim }
    });

    const hasPassword = !!((voter as any)?.password || admin?.password);
    const isAdmin = !!admin;

    // Check if OTP exists in Redis
    const existingOTP = await redis.get(`otp:${email}`);
    const hasActiveOTP = !!existingOTP;

    return NextResponse.json({
      hasPassword,
      isAdmin,
      requiresOTP: !hasPassword,
      hasActiveOTP
    });
  } catch (error) {
    console.error('Error checking password status:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
