import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;

    if (!signedSession) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const nim = email.split('@')[0];
    
    // Check if user is admin
    let isAdmin = false;
    try {
      const admin = await prisma.admin.findUnique({ where: { nim } });
      isAdmin = !!admin;
    } catch (adminError) {
      // If there's an error checking admin status, just set isAdmin to false
      console.error('Admin check error:', adminError);
      isAdmin = false;
    }

    return NextResponse.json({
      authenticated: true,
      nim,
      email,
      isAdmin
    });
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
