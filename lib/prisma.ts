import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // 開発時は ['query', 'info', 'warn', 'error'] でもOK
  });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
