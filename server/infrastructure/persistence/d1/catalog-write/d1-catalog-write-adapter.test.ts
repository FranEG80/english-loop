import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { D1CatalogWriteAdapter } from "./d1-catalog-write-adapter";

function database(existing: { id: string; status: string } | null = null) {
  const queries: string[] = [];
  const batches: number[] = [];
  const db: D1DatabaseLike = {
    prepare(query) {
      queries.push(query);
      const statement: D1PreparedStatement = {
        bind: () => statement,
        first: async <T>() => existing as T,
        all: async <T>() => ({ success: true, results: [] as T[] }),
        run: async <T>() => ({ success: true, results: [] as T[], meta: { changes: 1 } }),
      };
      return statement;
    },
    batch: async <T>(statements: D1PreparedStatement[]) => {
      batches.push(statements.length);
      return statements.map(() => ({ success: true, results: [] as T[], meta: { changes: 1 } }));
    },
  };
  return { db, queries, batches };
}

const input = {
  datasetVersion: "2026.08.04",
  checksum: "checksum",
  taxonomy: [],
  lessons: [],
  activities: [],
};

describe("D1CatalogWriteAdapter", () => {
  it("publishes only after the release and import batches complete", async () => {
    const fake = database();
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input);

    expect(result.status).toBe("published");
    expect(fake.batches.at(-1)).toBe(3);
    expect(fake.queries.some((query) => query.includes("CatalogPublication"))).toBe(true);
  });

  it("does not rewrite an already published checksum", async () => {
    const fake = database({ id: "release-1", status: "published" });
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input);

    expect(result.status).toBe("unchanged");
    expect(result.releaseId).toBe("release-1");
    expect(fake.batches).toHaveLength(0);
  });

  it("supports dry-run without opening a write batch", async () => {
    const fake = database();
    const result = await new D1CatalogWriteAdapter(fake.db).seedCatalog(input, { dryRun: true });

    expect(result.status).toBe("dry_run");
    expect(fake.queries).toHaveLength(0);
    expect(fake.batches).toHaveLength(0);
  });
});
