import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fullName, email, password, confirmPassword } = body || {};

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Full name is required." }, { status: 400 });
    }
    if (
      !email ||
      typeof email !== "string" ||
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
    ) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ ok: false, error: "Passwords do not match." }, { status: 400 });
    }

    // Duplicate email check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email is already registered." }, { status: 409 });
    }

    // Hash password (bcryptjs is pure JS -> Docker-friendly)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}

// Optional quick health check
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/auth/signup" });
}
