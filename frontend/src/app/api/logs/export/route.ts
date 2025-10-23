import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    const logs = await prisma.auditRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Convert logs to CSV format
    const csvRows = [
      // Header row
      ["Timestamp", "User", "Event Type", "Details"].join(","),
      // Data rows
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toISOString(),
          log.user?.name || "Unknown User",
          log.action,
          log.details || "",
        ]
          .map((field) => 
            // Escape fields that contain commas or quotes
            field.includes(",") || field.includes('"') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          )
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    // Set headers for CSV download
    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set(
      "Content-Disposition",
      `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    );

    return new Response(csvContent, {
      headers,
    });
  } catch (error) {
    console.error("Error exporting logs:", error);
    return NextResponse.json(
      { error: "Failed to export logs" },
      { status: 500 }
    );
  }
}