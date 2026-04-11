import { cookies } from 'next/headers';
import prisma from './prisma';
import { verifyCookie } from './secureCookie';

export interface AdminAuthResult {
  isAdmin: boolean;
  error?: string;
  nim?: string;
  email?: string;
}

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  const cookieStore = await cookies();
  const signedSession = cookieStore.get('voter_session')?.value;

  if (!signedSession) {
    return { isAdmin: false, error: 'No session found' };
  }

  const email = verifyCookie(signedSession);
  if (!email) {
    return { isAdmin: false, error: 'Invalid session' };
  }

  const nim = email.split('@')[0];
  
  try {
    const admin = await prisma.admin.findUnique({ where: { nim } });
    if (!admin) {
      return { isAdmin: false, error: 'Not an admin' };
    }
    return { isAdmin: true, nim, email };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isAdmin: false, error: 'Admin check failed' };
  }
}