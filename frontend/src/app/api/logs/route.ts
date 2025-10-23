import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const cursor = searchParams.get("cursor");

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.action = eventType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // If we have a cursor, start from that log
    if (cursor) {
      where.id = {
        lt: cursor, // Get items before this cursor
      };
    }

    const logs = await prisma.auditRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id.toString(),
      userId: log.userId.toString(),
      eventType: log.action,
      timestamp: log.createdAt.toISOString(),
      details: log.details || "",
      user: log.user
        ? {
            id: log.user.id.toString(),
            name: log.user.name || "Unknown",
          }
        : null,
    }));

    const nextCursor = logs.length === PAGE_SIZE ? logs[logs.length - 1].id : null;

    return NextResponse.json({
      logs: formattedLogs,
      nextCursor,
      hasMore: Boolean(nextCursor)
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}