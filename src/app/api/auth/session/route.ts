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
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const nim = email.split('@')[0];
    
    // Cache admin status check for 5 minutes
    const isAdmin = await getCacheOrSet(
      `admin:${nim}`,
      async () => {
        try {
          const admin = await prisma.admin.findUnique({ 
            where: { nim },
            select: { id: true } // Only select id to minimize data transfer
          });
          return !!admin;
        } catch (adminError) {
          console.error('Admin check error:', adminError);
          return false;
        }
      },
      { ttl: 300 } // Cache for 5 minutes
    );

    // Add cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=60'); // Private cache for 60 seconds
    
    return NextResponse.json({
      authenticated: true,
      nim,
      email,
      isAdmin
    }, { headers });
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
