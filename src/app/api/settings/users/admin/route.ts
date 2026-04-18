import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createAuditLog } from '@/lib/auditLog';
import { isSuperAdminNim } from '@/lib/superAdmin';

// POST - Toggle admin status for a user
export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminNim(auth.nim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat mengubah status admin' }, { status: 403 });
    }

    const { nim, isAdmin } = await request.json();

    if (!nim || typeof nim !== 'string') {
      return NextResponse.json(
        { error: 'NIM harus diisi' },
        { status: 400 }
      );
    }

    // Check if user exists
    const voter = await prisma.voter.findUnique({
      where: { nim }
    });

    if (!voter) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (isAdmin) {
      // Add to admin without default password
      try {
        await prisma.admin.create({
          data: {
            nim,
            email: `${nim}@mahasiswa.itb.ac.id`
          }
        });
      } catch (e: any) {
        // If already exists, that's okay
        if (e.code !== 'P2002') {
          throw e;
        }
      }
    } else {
      // Remove from admin
      try {
        await prisma.admin.delete({
          where: { nim }
        });
      } catch (e: any) {
        // If doesn't exist, that's okay
        if (e.code !== 'P2025') {
          throw e;
        }
      }
    }

    await createAuditLog({
      action: 'USER_UPDATED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetType: 'ADMIN',
      details: { targetNim: nim, isAdmin },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return NextResponse.json(
      { error: 'Gagal mengubah status admin' },
      { status: 500 }
    );
  }
}
