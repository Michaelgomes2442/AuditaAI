import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, confirmPassword } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    // Always call backend directly in local mode
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, confirmPassword })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        return NextResponse.json({ ok: true, user: data.user });
      } else {
        return NextResponse.json({ error: data.error || 'Registration failed' }, { status: response.status });
      }
    } catch (err) {
      console.error('Signup API error:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
