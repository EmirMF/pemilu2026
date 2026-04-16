import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import {
  buildStudentEmailFromNim,
  getOtpChallenge,
  getOtpChallengeTtl,
  isValidNim,
  normalizeNim,
} from '@/lib/authOtp';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const nim = url.searchParams.get('nim') || '';
    const normalizedNim = normalizeNim(nim);

    if (!normalizedNim || !isValidNim(normalizedNim)) {
      return NextResponse.json({ active: false }, { status: 200 });
    }

    const limit = await rateLimit(`otp-status:${normalizedNim}`, {
      interval: 60,
      maxRequests: 30,
    });

    if (!limit.success) {
      return NextResponse.json({ active: false }, { status: 429 });
    }

    const email = buildStudentEmailFromNim(normalizedNim);
    const challenge = await getOtpChallenge(email);

    if (!challenge) {
      return NextResponse.json({ active: false }, { status: 200 });
    }

    const ttl = await getOtpChallengeTtl(email);
    if (ttl <= 0) {
      return NextResponse.json({ active: false }, { status: 200 });
    }

    return NextResponse.json(
      {
        active: true,
        nim: normalizedNim,
        email,
        expiresIn: ttl,
        message: 'OTP masih aktif',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP status error:', error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
