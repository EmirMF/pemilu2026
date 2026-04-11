import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createAuditLog } from '@/lib/auditLog';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isInDPT } = await request.json();
    
    const voterBefore = await prisma.voter.findUnique({ where: { id } });
    
    await prisma.voter.update({
      where: { id },
      data: { isInDPT }
    });

    await createAuditLog({
      action: 'WHITELIST_ADDED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'VOTER',
      details: { isInDPT },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating voter:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengupdate voter.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const voter = await prisma.voter.findUnique({ where: { id } });
    if (!voter) {
      return NextResponse.json({ error: 'Voter tidak ditemukan' }, { status: 404 });
    }
    
    await prisma.voter.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'WHITELIST_REMOVED',
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
    console.error('Error deleting voter:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus voter.' }, { status: 500 });
  }
}
