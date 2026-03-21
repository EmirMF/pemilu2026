import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nim } = await request.json();

    if (!nim) {
      return NextResponse.json({ error: 'NIM wajib diisi.' }, { status: 400 });
    }

    const exists = await prisma.voter.findUnique({ where: { nim } });
    if (exists) {
      return NextResponse.json({ error: 'NIM sudah terdaftar.' }, { status: 400 });
    }

    const voter = await prisma.voter.create({
      data: { 
        nim,
        email: `${nim}@mahasiswa.itb.ac.id`
      }
    });

    return NextResponse.json(voter, { status: 201 });
  } catch (error) {
    console.error('Error creating voter:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
