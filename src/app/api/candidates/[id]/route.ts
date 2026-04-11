import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { createAuditLog } from '@/lib/auditLog';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id }
    });

    if (!candidate || candidate.isHidden) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan.' }, { status: 404 });
    }

    const { isHidden, ...safeCandidate } = candidate;
    return NextResponse.json(safeCandidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data kandidat.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, vision, mission, major, photo, draftLink, isHidden } = body;

    const candidate = await prisma.candidate.update({
      where: { id: id },
      data: {
        name,
        vision,
        mission,
        major,
        photo,
        draftLink,
        isHidden
      }
    });

    await createAuditLog({
      action: 'CANDIDATE_UPDATED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'CANDIDATE',
      status: 'SUCCESS',
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui data kandidat.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.candidate.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'CANDIDATE_DELETED',
      actorNim: auth.nim,
      actorEmail: auth.email,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'CANDIDATE',
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus kandidat.' }, { status: 500 });
  }
}
