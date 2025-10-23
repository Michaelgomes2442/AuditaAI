import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prismadb";
import { TOTP, Secret } from "otpauth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not initialized" },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const totp = new TOTP({
      issuer: "AuditaAI",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(user.twoFactorSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      // Log failed attempt
      await prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "TWO_FACTOR_FAILED",
          severity: "MEDIUM",
          description: "Failed 2FA verification attempt",
        },
      });

      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Hash backup codes for storage
    const hashedCodes = await Promise.all(
      backupCodes.map(async (code) => ({
        userId: user.id,
        code: await bcrypt.hash(code, 10),
      }))
    );

    // Enable 2FA and store backup codes
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
        },
      }),
      prisma.twoFactorBackup.createMany({
        data: hashedCodes,
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "TWO_FACTOR_ENABLED",
          severity: "LOW",
          description: "Two-factor authentication enabled",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      backupCodes,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}
