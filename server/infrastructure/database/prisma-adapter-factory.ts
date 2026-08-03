import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaPg } from "@prisma/adapter-pg";
import type { DatabaseProvider } from "@/server/infrastructure/config/config";

export type PrismaSqlAdapter = PrismaBetterSqlite3 | PrismaPg | PrismaMariaDb;

/**
 * Provider selection is made once while the process is booting. D1 is not
 * silently routed through SQLite: it has a native binding/HTTP bundle.
 */
export function createPrismaAdapter(
  provider: Exclude<DatabaseProvider, "d1">,
  databaseUrl: string,
): PrismaSqlAdapter {
  switch (provider) {
    case "sqlite":
      return new PrismaBetterSqlite3({ url: databaseUrl });
    case "postgresql":
      return new PrismaPg(databaseUrl);
    case "mariadb":
      return new PrismaMariaDb(databaseUrl);
  }
}

export function assertPrismaProvider(provider: DatabaseProvider): asserts provider is Exclude<DatabaseProvider, "d1"> {
  if (provider === "d1") {
    throw new Error(
      "DATABASE_PROVIDER=d1 must use the native D1 binding/HTTP persistence bundle; Prisma SQL adapters are not used.",
    );
  }
}
