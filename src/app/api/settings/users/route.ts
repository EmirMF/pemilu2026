import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all users (whitelist + admin status)
export async function GET() {
  try {
    const whitelists = await prisma.whitelist.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Check admin status for each user
    const users = await Promise.all(
      whitelists.map(async (whitelist) => {
        const admin = await prisma.admin.findUnique({
          where: { nim: whitelist.nim }
        });

        const voter = await prisma.voter.findUnique({
          where: { nim: whitelist.nim }
        });

        // Check password in both voter and admin tables
        const hasPassword = !!(voter?.password || admin?.password);

        return {
          id: whitelist.id,
          nim: whitelist.nim,
          name: (whitelist as any).name || (voter as any)?.name || null,
          email: voter?.email || `${whitelist.nim}@mahasiswa.itb.ac.id`,
          isAdmin: !!admin,
          isInDPT: (whitelist as any).isInDPT || false,
          hasPassword,
          createdAt: whitelist.createdAt
        };
      })
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}

// POST - Add new user to whitelist
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

    // Check if already exists
    const existing = await prisma.whitelist.findUnique({
      where: { nim: trimmedNim }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'NIM sudah terdaftar' },
        { status: 400 }
      );
    }

    // Add to whitelist
    const whitelist = await prisma.whitelist.create({
      data: { nim: trimmedNim }
    });

    return NextResponse.json({
      id: whitelist.id,
      nim: whitelist.nim,
      name: null,
      email: `${whitelist.nim}@mahasiswa.itb.ac.id`,
      isAdmin: false,
      isInDPT: false,
      createdAt: whitelist.createdAt
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan user' },
      { status: 500 }
    );
  }
}
