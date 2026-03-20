import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { sendOTPContent } from '@/lib/mailer';
import { getElectionSettings } from '@/lib/election';
import { rateLimit } from '@/lib/rateLimit';
import { signCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Rate limiting by email
    const rateLimitResult = await rateLimit(`send-otp:${email}`, {
      interval: 60, // 1 minute
      maxRequests: 3 // max 3 OTP requests per minute
    });

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

    // Check if election is open
     const electionSettings = await getElectionSettings();
    /* if (!electionSettings.isOpen) {
      return NextResponse.json({ error: 'Pemilihan sedang ditutup.' }, { status: 403 });
    } */

    // Check if OTP is enabled
    if (electionSettings.otpEnabled === false) {
      return NextResponse.json({
        error: 'OTP sedang tidak aktif. Silakan hubungi admin untuk informasi lebih lanjut.'
      }, { status: 403 });
    }

    if (!email || !/^[0-9]+@mahasiswa\.itb\.ac\.id$/.test(email)) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    const nim = email.split('@')[0];

    const isWhitelisted = await prisma.whitelist.findUnique({ where: { nim } });

    if (!isWhitelisted) {
      return NextResponse.json({ error: 'NIM tidak terdaftar di sistem' }, { status: 403 });
    }

    // Check if user is admin
    const admin = await prisma.admin.findUnique({ where: { nim } }).catch(() => null);
    const isAdmin = !!admin;

    // Get or create voter
    let voter = await prisma.voter.findUnique({ where: { nim } });

    if (!voter) {
      voter = await prisma.voter.create({
        data: { nim, email }
      });
    }

    // Generate 6-digit OTP using crypto.randomInt for better security
    const code = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before storing in Redis for security
    const hashedOTP = crypto.createHash('sha256').update(code).digest('hex');

    // Store hashed OTP in Redis (valid for 10 mins = 600 seconds)
    await redis.set(`otp:${email}`, hashedOTP, 'EX', 600);

    // Send email via Brevo (with test mode override)
    try {
      await sendOTPContent(email, code);
      console.log(`OTP email sent successfully for ${email}`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Log OTP to console for dev/testing purposes if email fails
      console.log(`\n\n[DEV MODE] OTP CODE FOR ${email}: ${code}\n\n`);
    }

    // Set signed email cookie (will overwrite old one automatically)
    const signedEmail = signCookie(email);
    const response = NextResponse.json({ success: true, message: 'OTP terkirim ke email Anda' });
    
    // Set cookie (will automatically overwrite old one with same name)
    response.cookies.set('otp_email', signedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'strict',
      path: '/'
    });

    // Audit: OTP sent
    await createAuditLog({
      action: 'LOGIN_OTP_SENT',
      actorNim: nim,
      actorEmail: email,
      actorRole: isAdmin ? 'ADMIN' : 'VOTER',
      status: 'SUCCESS',
    });

    return response;
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mengirim OTP.' }, { status: 500 });
  }
}
