import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { getElectionSettings } from '@/lib/election';
import { rateLimit } from '@/lib/rateLimit';
import { verifyCookie, signCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    // Get email from signed cookie
    const cookieStore = await cookies();
    const signedEmail = cookieStore.get('otp_email')?.value;

    if (!signedEmail) {
      return NextResponse.json({ error: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa.' }, { status: 400 });
    }

    // Verify signed cookie
    const email = verifyCookie(signedEmail);
    if (!email) {
      return NextResponse.json({ error: 'Cookie tidak valid.' }, { status: 400 });
    }

    // Rate limiting by email
    const rateLimitResult = await rateLimit(`verify-otp:${email}`, {
      interval: 60, // 1 minute
      maxRequests: 5 // max 5 verification attempts per minute
    });

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

    // Check if election is open
    const electionSettings = await getElectionSettings();
    /* if (!electionSettings.isOpen) {
      return NextResponse.json({ error: 'Pemilihan sedang ditutup.' }, { status: 403 });
    } */

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Kode OTP diperlukan.' }, { status: 400 });
    }

    // Check OTP hash in Redis
    const storedHashedOTP = await redis.get(`otp:${email}`);

    if (!storedHashedOTP) {
      return NextResponse.json({ error: 'Kode OTP tidak ditemukan atau telah kedaluwarsa.' }, { status: 400 });
    }

    // Hash the input OTP and compare with stored hash
    const inputHashedOTP = crypto.createHash('sha256').update(code).digest('hex');

    if (storedHashedOTP !== inputHashedOTP) {
      return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 });
    }

    const nim = email.split('@')[0];
    
    // Check if user is admin
    let isAdmin = false;
    try {
      const admin = await prisma.admin.findUnique({ where: { nim } });
      isAdmin = !!admin;
    } catch (e) {
      // Ignore admin check errors
    }

    // OTP is valid. Set a signed cookie for the user.
    const signedSession = signCookie(email);
    const response = NextResponse.json({ success: true, message: 'Verifikasi berhasil' });
    response.cookies.set('voter_session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    // Clean up OTP from Redis and remove otp_email cookie
    await redis.del(`otp:${email}`);
    response.cookies.delete('otp_email');

    // Audit: successful OTP verification
    await createAuditLog({
      action: 'LOGIN_OTP_VERIFIED',
      actorNim: nim,
      actorEmail: email,
      actorRole: isAdmin ? 'ADMIN' : 'VOTER',
      status: 'SUCCESS',
    });

    return response;
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
