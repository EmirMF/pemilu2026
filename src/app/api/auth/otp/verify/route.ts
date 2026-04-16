import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { signCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';
import {
  deleteOtpChallenge,
  getOtpChallenge,
  incrementOtpAttempts,
  buildStudentEmailFromNim,
  isValidNim,
  normalizeNim,
  verifyOtpCode,
  OTP_MAX_ATTEMPTS,
} from '@/lib/authOtp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const nim = typeof body?.nim === 'string' ? body.nim : '';
    const otp = typeof body?.otp === 'string' ? body.otp.replace(/\s+/g, '').trim() : '';
    const normalizedNim = normalizeNim(nim);
    const email = buildStudentEmailFromNim(normalizedNim);

    if (!normalizedNim || !otp) {
      return NextResponse.json(
        { error: 'NIM dan OTP diperlukan' },
        { status: 400 }
      );
    }

    if (!isValidNim(normalizedNim)) {
      return NextResponse.json({ error: 'NIM tidak valid' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP harus terdiri dari 6 angka' },
        { status: 400 }
      );
    }

    const limit = await rateLimit(`otp-verify:${normalizedNim}`, {
      interval: 60,
      maxRequests: 10,
    });

    if (!limit.success) {
      const resetIn = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

    const challenge = await getOtpChallenge(email);
    if (!challenge) {
      return NextResponse.json(
        { error: 'OTP sudah kedaluwarsa. Silakan kirim ulang.' },
        { status: 400 }
      );
    }

    if (!verifyOtpCode(email, otp, challenge)) {
      const updatedChallenge = await incrementOtpAttempts(email);

      if (!updatedChallenge) {
        return NextResponse.json(
          { error: 'OTP sudah kedaluwarsa. Silakan kirim ulang.' },
          { status: 400 }
        );
      }

      if (updatedChallenge.attempts >= OTP_MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan OTP. Silakan kirim ulang.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'OTP salah. Silakan coba lagi.' },
        { status: 401 }
      );
    }

    const voter = await prisma.voter.findUnique({
      where: { nim: normalizedNim },
      select: { nim: true },
    });

    if (!voter) {
      await deleteOtpChallenge(email);
      return NextResponse.json(
        { error: 'Email tidak terdaftar di daftar pemilih' },
        { status: 403 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { nim: voter.nim },
      select: { id: true },
    });

    await deleteOtpChallenge(email);

    await createAuditLog({
      action: 'LOGIN_OTP_SUCCESS',
      actorNim: voter.nim,
      actorEmail: email,
      actorRole: admin ? 'ADMIN' : 'VOTER',
      status: 'SUCCESS',
      details: { method: 'otp', emailDomain: 'mahasiswa.itb.ac.id' },
    });

    const signedSession = signCookie(email);
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      isAdmin: !!admin,
      redirectTo: admin ? '/dashboard' : '/',
    });

    response.cookies.set('voter_session', signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat verifikasi OTP' },
      { status: 500 }
    );
  }
}
