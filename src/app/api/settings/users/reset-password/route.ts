import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { nim } = await request.json();

    if (!nim || typeof nim !== 'string') {
      return NextResponse.json(
        { error: 'NIM harus diisi' },
        { status: 400 }
      );
    }

    const trimmedNim = nim.trim();

    // Check if user exists in voter or admin table
    const voter = await prisma.voter.findUnique({
      where: { nim: trimmedNim }
    });

    const admin = await prisma.admin.findUnique({
      where: { nim: trimmedNim }
    });

    if (!voter && !admin) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Prevent resetting password for admin users
    if (admin) {
      return NextResponse.json(
        { error: 'Tidak dapat reset password admin. Admin harus reset password sendiri di Settings.' },
        { status: 403 }
      );
    }

    // Reset password in voter table only
    if (voter) {
      await prisma.voter.update({
        where: { nim: trimmedNim },
        data: { password: null }
      });
    }

    // Audit log
    await createAuditLog({
      action: 'PASSWORD_SET',
      actorRole: 'ADMIN',
      targetType: 'USER',
      targetId: voter?.id || admin?.id || '',
      details: { action: 'reset', nim: trimmedNim, isAdmin: !!admin },
      status: 'SUCCESS',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password berhasil direset' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Gagal reset password' },
      { status: 500 }
    );
  }
}
