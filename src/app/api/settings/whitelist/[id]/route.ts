import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isInDPT } = await request.json();
    
    await prisma.voter.update({
      where: { id },
      data: { isInDPT }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating voter:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengupdate voter.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.voter.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voter:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus voter.' }, { status: 500 });
  }
}
