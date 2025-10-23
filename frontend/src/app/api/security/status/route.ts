import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prismadb";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        twoFactorEnabled: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled,
      failedLoginAttempts: user.failedLoginAttempts,
      isLocked: user.lockedUntil ? new Date(user.lockedUntil) > new Date() : false,
      passwordChangedAt: user.passwordChangedAt,
    });
  } catch (error) {
    console.error("Security status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
