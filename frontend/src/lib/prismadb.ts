import { PrismaClient } from "../generated/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// simple audit helper
export async function recordAudit(userId: number, action: string, details?: string) {
  // increment lamport
  const state = await prisma.lamportState.upsert({
    where: { key: "global" },
    update: { lamport: { increment: 1 }, modified: new Date() },
    create: { key: "global", value: "init", lamport: 1 },
  });

  const lamport = state.lamport;

  return prisma.auditRecord.create({
    data: { userId, action, details, lamport, category: "SYSTEM" },
  });
}
