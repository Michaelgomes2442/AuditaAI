import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [totalRecords, uniqueUsers, recentActivity] = await Promise.all([
      prisma.auditRecord.count(),
      prisma.auditRecord.findMany({
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.auditRecord.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true }
      })
    ]);

    return NextResponse.json({
      totalRecords,
      uniqueUsers: uniqueUsers.length,
      recentActivity
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}