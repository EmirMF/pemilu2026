import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH - Update user name
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    // Get the whitelist entry to find the NIM
    const whitelist = await prisma.whitelist.findUnique({
      where: { id }
    });

    if (!whitelist) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update whitelist
    await prisma.whitelist.update({
      where: { id },
      data: { name: name || null }
    });

    // Update voter if exists
    try {
      await prisma.voter.update({
        where: { nim: whitelist.nim },
        data: { name: name || null }
      });
    } catch (e) {
      // Voter might not exist yet
    }

    // Update admin if exists
    try {
      await prisma.admin.update({
        where: { nim: whitelist.nim },
        data: { name: name || null }
      });
    } catch (e) {
      // Admin might not exist
    }

    return NextResponse.json({ success: true, name: name || null });
  } catch (error) {
    console.error('Error updating user name:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate nama' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user from whitelist (and admin if applicable)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the whitelist entry to find the NIM
    const whitelist = await prisma.whitelist.findUnique({
      where: { id }
    });

    if (!whitelist) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete from admin if exists
    try {
      await prisma.admin.delete({
        where: { nim: whitelist.nim }
      });
    } catch (e) {
      // Admin entry might not exist, that's okay
    }

    // Delete from whitelist
    await prisma.whitelist.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus user' },
      { status: 500 }
    );
  }
}
