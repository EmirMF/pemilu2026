import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { isSuperAdminNim } from '@/lib/superAdmin';

// GET - Fetch all users (voters + admin status)
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Check admin status for each user
    const users = await Promise.all(
      voters.map(async (voter) => {
        const admin = await prisma.admin.findUnique({
          where: { nim: voter.nim }
        });

        // Check password in both voter and admin tables
        const hasPassword = !!(voter.password || admin?.password);

        return {
          id: voter.id,
          nim: voter.nim,
          name: voter.name || null,
          email: voter.email || `${voter.nim}@mahasiswa.itb.ac.id`,
          isAdmin: !!admin,
          isInDPT: voter.isInDPT || false,
          hasPassword,
          createdAt: voter.createdAt
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

// POST - Add new user
export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminNim(auth.nim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat menambahkan user' }, { status: 403 });
    }

    const { nim } = await request.json();

    if (!nim || typeof nim !== 'string') {
      return NextResponse.json(
        { error: 'NIM harus diisi' },
        { status: 400 }
      );
    }

    const trimmedNim = nim.trim();

    // Check if already exists
    const existing = await prisma.voter.findUnique({
      where: { nim: trimmedNim }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'NIM sudah terdaftar' },
        { status: 400 }
      );
    }

    // Add voter
    const voter = await prisma.voter.create({
      data: { 
        nim: trimmedNim,
        email: `${trimmedNim}@mahasiswa.itb.ac.id`
      }
    });

    return NextResponse.json({
      id: voter.id,
      nim: voter.nim,
      name: voter.name,
      email: voter.email,
      isAdmin: false,
      isInDPT: voter.isInDPT,
      createdAt: voter.createdAt
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan user' },
      { status: 500 }
    );
  }
}
