import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyCookie, signCookie } from "@/lib/secureCookie";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const nim = email.split('@')[0];

    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { nim },
    });

    // Check if user is voter
    const voter = await prisma.voter.findUnique({
      where: { email },
    });

    if (!admin && !voter) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    if (admin) {
      await prisma.admin.update({
        where: { nim },
        data: { password: hashedPassword },
      });
    } else if (voter) {
      await prisma.voter.update({
        where: { email },
        data: { password: hashedPassword } as any,
      });
    }

    // Create session
    const signedEmail = signCookie(email);
    const cookieStore = await cookies();
    cookieStore.set('voter_session', signedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diatur",
      isAdmin: !!admin,
    });
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengatur password" },
      { status: 500 }
    );
  }
}
