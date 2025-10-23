import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Mock data for demo - replace with real database queries after migration
export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock configurations
    const configs = [
      {
        id: 1,
        provider: "SAML",
        enabled: true,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      },
    ];

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("SSO config fetch error:", error);
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

    const data = await request.json();

    // Validate required fields
    if (!data.provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // TODO: Create SSO configuration in database after migration
    console.log("SSO config would be created:", data);

    return NextResponse.json({ 
      success: true,
      message: "SSO configuration created (demo mode)" 
    });
  } catch (error) {
    console.error("SSO config create error:", error);
    return NextResponse.json(
      { error: "Failed to create SSO configuration" },
      { status: 500 }
    );
  }
}
