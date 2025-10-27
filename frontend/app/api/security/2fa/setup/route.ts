import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prismadb";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";

export async function POST() {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a new secret
    const secret = new Secret({ size: 20 });
    
    // Create TOTP instance
    const totp = new TOTP({
      issuer: "AuditaAI",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Generate QR code
    const uri = totp.toString();
    const qrCode = await QRCode.toDataURL(uri);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Store the secret temporarily (will be confirmed on verification)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode,
      backupCodes,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    );
  }
}
