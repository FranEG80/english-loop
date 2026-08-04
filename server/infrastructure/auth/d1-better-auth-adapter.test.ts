import { describe, expect, it } from "vitest";
import type { D1Operation } from "@/server/infrastructure/persistence/d1/types/operations";
import type { D1Result } from "@/server/infrastructure/persistence/d1/types/binding";
import { createD1BetterAuthAdapter } from "./d1-better-auth-adapter";

function transport() {
  const calls: D1Operation[] = [];
  let failed = false;
  return {
    calls,
    setFailed(value: boolean) { failed = value; },
    execute: async (request: D1Operation): Promise<D1Result> => {
      calls.push(request);
      if (failed) return { success: false, results: [] };
      if (request.name === "authCount") return { success: true, results: [{ count: 3 }] };
      if (request.name === "authUpdateMany" || request.name === "authDeleteMany") return { success: true, results: [], meta: { changes: 2 } };
      return { success: true, results: [{ id: "user-1", email: "user@example.com" }] };
    },
    batch: async () => [],
  };
}

const where = [{ field: "email", operator: "eq" as const, value: "user@example.com", connector: "AND" as const }];
const sessionWhere = [{ field: "token", operator: "eq" as const, value: "token", connector: "AND" as const }];

describe("D1 Better Auth adapter", () => {
  it("maps Better Auth CRUD operations to the typed D1 transport", async () => {
    const base = transport();
    const adapter = createD1BetterAuthAdapter(base)({} as never);

    await expect(adapter.create({ model: "user", data: { id: "user-1", createdAt: new Date("2026-01-01"), tags: ["one", "two"] }, select: ["id"] })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.findOne({ model: "user", where, select: ["id"] })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.findMany({ model: "session", where: sessionWhere, limit: 10, offset: 2, sortBy: { field: "createdAt", direction: "desc" } })).resolves.toHaveLength(1);
    await expect(adapter.count({ model: "user", where })).resolves.toBe(3);
    await expect(adapter.update({ model: "user", where, update: { name: "Updated" } })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.updateMany({ model: "user", where, update: { name: "Updated" } })).resolves.toBe(2);
    await expect(adapter.delete({ model: "user", where })).resolves.toBeUndefined();
    await expect(adapter.deleteMany({ model: "user", where })).resolves.toBe(2);
    await expect(adapter.consumeOne({ model: "user", where })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.incrementOne({ model: "user", where, increment: { emailVerified: 1 } })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.incrementOne({ model: "user", where, increment: { emailVerified: 1 }, set: { name: "Updated" } })).resolves.toMatchObject({ id: "user-1" });
    expect(base.calls.map(({ name }) => name)).toEqual([
      "authCreate", "authFindOne", "authFindMany", "authCount", "authUpdate", "authUpdateMany", "authDelete", "authDeleteMany", "authConsumeOne", "authIncrementOne", "authIncrementOne",
    ]);
  });

  it("handles missing rows, unsupported models and failed D1 results", async () => {
    const base = transport();
    const adapter = createD1BetterAuthAdapter(base)({} as never);
    await expect(adapter.findOne({ model: "user", where: [] })).resolves.toMatchObject({ id: "user-1" });
    await expect(adapter.findOne({ model: "Unsupported", where: [] })).rejects.toMatchObject({ message: "Model \"Unsupported\" not found in schema" });
    base.setFailed(true);
    await expect(adapter.findMany({ model: "user", where: [], limit: 1 })).rejects.toMatchObject({ message: "D1 Better Auth operation failed" });
  });
});
