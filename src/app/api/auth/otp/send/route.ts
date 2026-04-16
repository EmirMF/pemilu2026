import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import {
  buildStudentEmailFromNim,
  generateOtpCode,
  deleteOtpChallenge,
  getOtpChallenge,
  getOtpChallengeTtl,
  isValidNim,
  normalizeNim,
  saveOtpChallenge,
} from '@/lib/authOtp';
import { sendOtpEmailViaGmail } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const nim = typeof body?.nim === 'string' ? body.nim : '';
    const resend = body?.resend === true;
    const normalizedNim = normalizeNim(nim);

    if (!normalizedNim) {
      return NextResponse.json({ error: 'NIM diperlukan' }, { status: 400 });
    }

    if (!isValidNim(normalizedNim)) {
      return NextResponse.json({ error: 'NIM tidak valid' }, { status: 400 });
    }

    const voter = await prisma.voter.findUnique({
      where: { nim: normalizedNim },
      select: { nim: true, name: true, email: true },
    });

    if (!voter) {
      return NextResponse.json(
        { error: 'NIM tidak terdaftar. Hubungi administrator.' },
        { status: 403 }
      );
    }

    const email = buildStudentEmailFromNim(normalizedNim);
    const limit = await rateLimit(`otp-send:${normalizedNim}`, {
      interval: 300,
      maxRequests: 3,
    });

    if (!limit.success) {
      const resetIn = Math.ceil((limit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan OTP. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

    const existingChallenge = await getOtpChallenge(email);
    if (existingChallenge && !resend) {
      const ttl = await getOtpChallengeTtl(email);
      if (ttl > 0) {
        return NextResponse.json({
          success: true,
          active: true,
          message: 'OTP masih aktif. Silakan cek email sebelumnya.',
          email,
          nim: normalizedNim,
          expiresIn: ttl,
        });
      }
    }

    if (existingChallenge && resend) {
      await deleteOtpChallenge(email);
    }

    const otpCode = generateOtpCode();
    await saveOtpChallenge(email, otpCode);

    try {
      await sendOtpEmailViaGmail(email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      await deleteOtpChallenge(email);
      return NextResponse.json(
        { error: 'Gagal mengirim OTP. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      active: true,
      message: resend ? 'OTP baru berhasil dikirim ke email mahasiswa' : 'OTP berhasil dikirim ke email mahasiswa',
      email,
      nim: normalizedNim,
      expiresIn: 600,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim OTP' },
      { status: 500 }
    );
  }
}
