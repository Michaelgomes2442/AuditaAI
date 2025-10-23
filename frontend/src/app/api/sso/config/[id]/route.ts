import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { enabled } = await request.json();

    // TODO: Update SSO configuration in database after migration
    console.log(`SSO config ${id} would be updated:`, { enabled });

    return NextResponse.json({ 
      success: true,
      message: "SSO configuration updated (demo mode)" 
    });
  } catch (error) {
    console.error("SSO config update error:", error);
    return NextResponse.json(
      { error: "Failed to update SSO configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // TODO: Delete SSO configuration from database after migration
    console.log(`SSO config ${id} would be deleted`);

    return NextResponse.json({ 
      success: true,
      message: "SSO configuration deleted (demo mode)" 
    });
  } catch (error) {
    console.error("SSO config delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete SSO configuration" },
      { status: 500 }
    );
  }
}
