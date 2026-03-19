import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/secureCookie';
import { createAuditLog } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_NIM = '18224066';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  const signedSession = cookieStore.get('voter_session')?.value;

  if (!signedSession) {
    return { isSuperAdmin: false, error: 'No session found' };
  }

  const email = verifyCookie(signedSession);
  if (!email) {
    return { isSuperAdmin: false, error: 'Invalid session' };
  }

  const nim = email.split('@')[0];
  
  if (nim !== SUPER_ADMIN_NIM) {
    return { isSuperAdmin: false, error: 'Not authorized' };
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { nim } });
    if (!admin) {
      return { isSuperAdmin: false, error: 'Not an admin' };
    }
    return { isSuperAdmin: true, nim, email };
  } catch (error) {
    console.error('Admin check error:', error);
    return { isSuperAdmin: false, error: 'Admin check failed' };
  }
}

// Check if publish password is set
export async function GET() {
  try {
    const settings = await prisma.electionSettings.findUnique({
      where: { key: 'main' },
    });

    return NextResponse.json({ 
      hasPassword: !!(settings as any)?.publishPassword 
    });
  } catch (error) {
    console.error('Error checking publish password:', error);
    return NextResponse.json(
      { error: 'Failed to check password status' },
      { status: 500 }
    );
  }
}

// Set or update publish password (super admin only)
export async function PUT(request: Request) {
  try {
    const auth = await checkSuperAdmin();
    if (!auth.isSuperAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password harus minimal 6 karakter' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.electionSettings.upsert({
      where: { key: 'main' },
      update: {
        publishPassword: hashedPassword,
      },
      create: {
        key: 'main',
        publishPassword: hashedPassword,
      },
    });

    await createAuditLog({
      action: 'SETTINGS_GRADIENT_CHANGED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetType: 'PUBLISH_PASSWORD',
      details: { action: 'password_updated' },
      status: 'SUCCESS',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password publikasi berhasil diperbarui'
    });
  } catch (error) {
    console.error('Error updating publish password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
