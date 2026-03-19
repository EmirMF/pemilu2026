import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const whitelists = await prisma.whitelist.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(whitelists);
  } catch (error) {
    console.error('Error fetching whitelists:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nim } = await request.json();

    if (!nim) {
      return NextResponse.json({ error: 'NIM wajib diisi.' }, { status: 400 });
    }

    const exists = await prisma.whitelist.findUnique({ where: { nim } });
    if (exists) {
      return NextResponse.json({ error: 'NIM sudah ada di whitelist.' }, { status: 400 });
    }

    const whitelist = await prisma.whitelist.create({
      data: { nim }
    });

    return NextResponse.json(whitelist, { status: 201 });
  } catch (error) {
    console.error('Error creating whitelist:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
