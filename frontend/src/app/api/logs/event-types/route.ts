import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const distinctActions = await prisma.auditRecord.findMany({
      distinct: ["action"],
      select: {
        action: true,
      },
    });

    return NextResponse.json(distinctActions.map(a => a.action));
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch event types" },
      { status: 500 }
    );
  }
}