import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const signedEmail = cookieStore.get('otp_email')?.value;

    if (!signedEmail) {
      return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 404 });
    }

    // Verify signed cookie
    const email = verifyCookie(signedEmail);
    if (!email) {
      return NextResponse.json({ error: 'Cookie tidak valid' }, { status: 400 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Get OTP Email Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
