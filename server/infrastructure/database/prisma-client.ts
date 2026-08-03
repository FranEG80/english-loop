import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { config } from "@/server/infrastructure/config/config";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: config.databaseUrl,
  });
  return new PrismaClient({ adapter });
}

/**
 * Singleton seguro de Prisma para desarrollo. Evita crear múltiples
 * conexiones durante hot-reload de Next.js.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
