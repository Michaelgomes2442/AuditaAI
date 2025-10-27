import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prismadb";

export async function GET() {
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

    const whitelist = await prisma.ipWhitelist.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      whitelist: whitelist.map((item: any) => item.ipAddress),
    });
  } catch (error) {
    console.error("IP whitelist fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ipAddress, description } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create IP whitelist entry
    await prisma.$transaction([
      prisma.ipWhitelist.create({
        data: {
          userId: user.id,
          ipAddress,
          description: description || `Added on ${new Date().toLocaleDateString()}`,
          createdBy: user.id,
        },
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "IP_WHITELIST_ADDED",
          severity: "LOW",
          ipAddress,
          description: `IP address ${ipAddress} added to whitelist`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IP whitelist add error:", error);
    return NextResponse.json(
      { error: "Failed to add IP address" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ipAddress } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove IP whitelist entry
    await prisma.$transaction([
      prisma.ipWhitelist.deleteMany({
        where: {
          userId: user.id,
          ipAddress,
        },
      }),
      prisma.securityEvent.create({
        data: {
          userId: user.id,
          eventType: "IP_WHITELIST_REMOVED",
          severity: "LOW",
          ipAddress,
          description: `IP address ${ipAddress} removed from whitelist`,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IP whitelist remove error:", error);
    return NextResponse.json(
      { error: "Failed to remove IP address" },
      { status: 500 }
    );
  }
}
