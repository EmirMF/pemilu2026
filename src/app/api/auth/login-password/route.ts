import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signCookie } from "@/lib/secureCookie";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    const nim = email.split('@')[0];

    // Rate limit: 5 login attempts per minute per NIM
    const rateLimitResult = await rateLimit(`login-password:${nim}`, {
      interval: 60,
      maxRequests: 5
    });

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

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
        { error: "Email tidak terdaftar" },
        { status: 401 }
      );
    }

    let isPasswordValid = false;
    let isAdmin = false;

    // Check admin password
    if (admin && admin.password) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
      isAdmin = true;
    }
    // Check voter password
    else if (voter && (voter as any).password) {
      isPasswordValid = await bcrypt.compare(password, (voter as any).password);
      isAdmin = false;
    } else {
      return NextResponse.json(
        { error: "Password belum diatur. Silakan login dengan OTP terlebih dahulu." },
        { status: 401 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password salah" },
        { status: 401 }
      );
    }

    // Create session cookie with email
    const signedSession = signCookie(email);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      isAdmin,
      redirectTo: "/",
    });

    response.cookies.set("voter_session", signedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login password error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
}
