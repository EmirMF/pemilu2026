import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isInDPT } = await request.json();
    
    await prisma.whitelist.update({
      where: { id },
      data: { isInDPT }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating whitelist:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengupdate whitelist.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.whitelist.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting whitelist:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus whitelist.' }, { status: 500 });
  }
}
