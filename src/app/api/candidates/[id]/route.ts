import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mengambil data kandidat.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, vision, mission, photo, draftLink } = body;

    const candidate = await prisma.candidate.update({
      where: { id: id },
      data: {
        name,
        vision,
        mission,
        photo,
        draftLink
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memperbarui data kandidat.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.candidate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Kandidat berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menghapus kandidat.' }, { status: 500 });
  }
}
