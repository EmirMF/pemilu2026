import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signCookie } from "@/lib/secureCookie";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nim: nimInput } = body;

    // Support both email and nim input
    let nim: string;
    let email_to_use: string;

    if (nimInput) {
      // If nim is provided directly (from /admin page)
      nim = nimInput;
      email_to_use = `${nim}@mahasiswa.itb.ac.id`;
    } else if (email) {
      // If email is provided (from regular login)
      nim = email.split('@')[0];
      email_to_use = email;
    } else {
      return NextResponse.json(
        { error: "NIM atau email harus diisi" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password harus diisi" },
        { status: 400 }
      );
    }

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

    let isAdmin = false;
    let isPasswordValid = false;

    if (admin) {
      if (admin.password) {
        isPasswordValid = await bcrypt.compare(password, admin.password);
      }
      if (isPasswordValid) {
        isAdmin = true;
      }
    }

    // If not admin or admin password doesn't match, check voter table
    if (!isPasswordValid) {
      const voter = await prisma.voter.findUnique({
        where: { nim },
      });

      if (voter && voter.password) {
        isPasswordValid = await bcrypt.compare(password, voter.password);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "NIM atau password salah" },
        { status: 401 }
      );
    }

    // Create session cookie with email
    const signedSession = signCookie(email_to_use);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      isAdmin: isAdmin,
      redirectTo: isAdmin ? "/dashboard" : "/",
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
