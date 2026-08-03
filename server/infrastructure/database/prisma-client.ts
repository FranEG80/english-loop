import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/server/infrastructure/config/config";
import { assertPrismaProvider, createPrismaAdapter } from "./prisma-adapter-factory";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  assertPrismaProvider(config.databaseProvider);
  const adapter = createPrismaAdapter(config.databaseProvider, config.databaseUrl);
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
