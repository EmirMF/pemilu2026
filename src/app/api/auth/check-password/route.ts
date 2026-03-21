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

    // Check if OTP exists in Redis
    const existingOTP = await redis.get(`otp:${email}`);
    const hasActiveOTP = !!existingOTP;

    // For non-admin users, always use OTP (no password)
    // For admin users, they should use /admin route with password
    return NextResponse.json({
      hasPassword: false, // Always false for regular login
      isAdmin,
      requiresOTP: true, // Always require OTP for regular login
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
