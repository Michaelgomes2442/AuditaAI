import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch all feedback for admin
export async function GET(request: NextRequest) {
  try {
    // In production, verify admin role
    const feedback = await prisma.feedback.findMany({
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      take: 200,
    });

    // Get user info for each feedback (simplified - in production join in query)
    const feedbackWithUsers = await Promise.all(
      feedback.map(async (f) => {
        const user = await prisma.user.findUnique({
          where: { id: f.userId },
          select: { id: true, email: true, name: true }
        });
        return { ...f, user };
      })
    );

    return NextResponse.json({ feedback: feedbackWithUsers });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
