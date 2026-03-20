import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import { deleteCache } from '@/lib/cache';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;
    
    // Invalidate admin cache before logout
    if (signedSession) {
      const email = verifyCookie(signedSession);
      if (email) {
        const nim = email.split('@')[0];
        await deleteCache(`admin:${nim}`);
      }
    }
    
    // Delete the voter_session cookie
    cookieStore.delete('voter_session');
    
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
