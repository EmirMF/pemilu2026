import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createAuditLog } from '@/lib/auditLog';
import { isSuperAdminNim } from '@/lib/superAdmin';

// PATCH - Update user name
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminNim(auth.nim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat mengubah nama user' }, { status: 403 });
    }

    const { id } = await params;
    const { name } = await request.json();

    // Get the voter entry to find the NIM
    const voter = await prisma.voter.findUnique({
      where: { id }
    });

    if (!voter) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update voter
    await prisma.voter.update({
      where: { id },
      data: { name: name || null }
    });

    // Update admin if exists
    try {
      await prisma.admin.update({
        where: { nim: voter.nim },
        data: { name: name || null }
      });
    } catch (e) {
      // Admin might not exist
    }

    await createAuditLog({
      action: 'USER_UPDATED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'VOTER',
      details: { name },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, name: name || null });
  } catch (error) {
    console.error('Error updating user name:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate nama' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user (and admin if applicable)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminNim(auth.nim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat menghapus user' }, { status: 403 });
    }

    const { id } = await params;

    // Get the voter entry to find the NIM
    const voter = await prisma.voter.findUnique({
      where: { id }
    });

    if (!voter) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete from admin if exists
    try {
      await prisma.admin.delete({
        where: { nim: voter.nim }
      });
    } catch (e) {
      // Admin entry might not exist, that's okay
    }

    // Delete from voter
    await prisma.voter.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'USER_DELETED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'VOTER',
      details: { deletedNim: voter.nim },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    );
  }
}
