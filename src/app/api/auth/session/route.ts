import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import prisma from '@/lib/prisma';
import { getCacheOrSet } from '@/lib/cache';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;

    if (!signedSession) {
      return NextResponse.json({ authenticated: false, isAuthenticated: false }, { status: 200 });
    }

    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ authenticated: false, isAuthenticated: false }, { status: 200 });
    }

    const nim = email.split('@')[0];
    
    const isAdmin = await getCacheOrSet(
      `admin:${nim}`,
      async () => {
        try {
          const admin = await prisma.admin.findUnique({ 
            where: { nim },
            select: { id: true }
          });
          return !!admin;
        } catch (adminError) {
          console.error('Admin check error:', adminError);
          return false;
        }
      },
      { ttl: 300 }
    );

    const response = NextResponse.json({
      authenticated: true,
      isAuthenticated: true,
      nim,
      email,
      isAdmin
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ authenticated: false, isAuthenticated: false }, { status: 200 });
  }
}
