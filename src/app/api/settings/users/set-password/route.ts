import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { nim, password } = await request.json();

    if (!nim || typeof nim !== 'string') {
      return NextResponse.json(
        { error: 'NIM harus diisi' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password harus diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const trimmedNim = nim.trim();

    const voter = await prisma.voter.findUnique({
      where: { nim: trimmedNim }
    });

    if (!voter) {
      return NextResponse.json(
        { error: 'Voter tidak ditemukan' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.voter.update({
      where: { nim: trimmedNim },
      data: { password: hashedPassword }
    });

    await createAuditLog({
      action: 'PASSWORD_SET',
      actorRole: 'ADMIN',
      targetType: 'USER',
      targetId: voter.id,
      details: { action: 'set', nim: trimmedNim },
      status: 'SUCCESS',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password berhasil diatur' 
    });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Gagal mengatur password' },
      { status: 500 }
    );
  }
}