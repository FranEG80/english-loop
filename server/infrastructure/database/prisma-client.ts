import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/server/infrastructure/config/config";
import { assertPrismaProvider, createPrismaAdapter } from "./prisma-adapter-factory";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  if (config.databaseProvider === "d1") {
    // D1 is handled by the native persistence bundle. Keep the module
    // importable so the composition root can select that bundle without
    // constructing a Prisma client, but fail loudly if a Prisma-only path is
    // accidentally used under D1.
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          "Prisma is unavailable with DATABASE_PROVIDER=d1; use the native D1 persistence bundle.",
        );
      },
    });
  }
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
