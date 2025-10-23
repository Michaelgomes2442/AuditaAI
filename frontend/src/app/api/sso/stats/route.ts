import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock stats - replace with real database queries after migration
    const stats = {
      totalLogins: 0,
      activeConfigs: 0,
      jitUsersCreated: 0,
      lastLogin: null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("SSO stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
