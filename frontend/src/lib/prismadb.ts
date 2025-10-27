import { PrismaClient } from "../generated/prisma";
// import { withOptimize } from "@prisma/extension-optimize";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

try {
  prisma = global.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  // .$extends(
  //   withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY })
  // );
  if (process.env.NODE_ENV !== "production") global.prisma = prisma;
} catch (error) {
  console.warn('Failed to initialize Prisma client:', error);
  // Create a mock client that throws meaningful errors
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      return new Proxy({}, {
        get() {
          throw new Error(`Database connection not available. Please check your DATABASE_URL configuration.`);
        }
      });
    }
  });
}

export { prisma };

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
