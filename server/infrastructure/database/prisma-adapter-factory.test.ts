import { describe, expect, it } from "vitest";
import { assertPrismaProvider, createPrismaAdapter } from "./prisma-adapter-factory";

describe("Prisma adapter factory", () => {
  it("selects the configured SQL driver without opening a connection", () => {
    expect(createPrismaAdapter("sqlite", "file:./test.db").adapterName).toContain("better-sqlite3");
    expect(createPrismaAdapter("postgresql", "postgresql://localhost/english_loop").adapterName).toContain("pg");
    expect(createPrismaAdapter("mariadb", "mariadb://localhost/english_loop").adapterName).toContain("mariadb");
  });

  it("does not allow D1 to fall back to SQLite", () => {
    expect(() => assertPrismaProvider("d1")).toThrow("native D1");
  });
});
