import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import type { Role, Permission } from "@/generated/prisma";
import { Role as RoleEnum, Permission as PermissionEnum } from "@/generated/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, role } = await req.json();

    // Create organization with TRIAL status
    const organization = await prisma.organization.create({
      data: {
        name,
        plan: "TRIAL",
        status: "ACTIVE",
      },
    });

    // Create initial user password (they'll change this on first login)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(tempPassword, 12);

    // Create admin user for the organization
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
  role: role as Role,
        orgId: organization.id,
        permissions: {
          set: [
            PermissionEnum.READ_LOGS,
            PermissionEnum.WRITE_LOGS,
            PermissionEnum.MANAGE_USERS,
            PermissionEnum.MANAGE_TEAMS,
            PermissionEnum.VERIFY_RECORDS,
            PermissionEnum.EXPORT_DATA,
            PermissionEnum.VIEW_ANALYTICS,
            PermissionEnum.MANAGE_SETTINGS,
          ],
        },
      },
    });

    // Create default team
    const team = await prisma.team.create({
      data: {
        name: "Default Team",
        orgId: organization.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create initial audit record
    await prisma.auditRecord.create({
      data: {
        userId: user.id,
        action: "ORGANIZATION_CREATED",
        category: "SYSTEM",
        details: {
          organizationId: organization.id,
          organizationName: name,
          adminEmail: email,
          adminRole: role,
        },
        status: "SUCCESS",
        lamport: 1,
      },
    });

    // Initialize Lamport state
    await prisma.lamportState.create({
      data: {
        key: `org:${organization.id}`,
        value: "INITIALIZED",
        lamport: 1,
        metadata: {
          organizationId: organization.id,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      tempPassword,
      organization: {
        id: organization.id,
        name: organization.name,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}