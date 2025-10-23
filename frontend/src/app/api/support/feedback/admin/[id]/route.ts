import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// PATCH - Update feedback status or add response
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);
    const body = await request.json();
    const { status, response } = body;

    // In production, verify admin role and get admin user ID
    const adminUserId = 1;

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === "RESOLVED" || status === "CLOSED") {
        updateData.resolvedAt = new Date();
      }
    }

    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = adminUserId;
    }

      const feedback = await prisma.feedback.update({
        where: { id: parsedId },
        data: updateData,
    });

    // In production, send email notification to user
    // await notifyUser(feedback);

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Failed to update feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    // In production, verify admin role
    await prisma.feedback.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
