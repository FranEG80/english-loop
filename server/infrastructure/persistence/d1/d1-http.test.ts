import { describe, expect, it } from "vitest";
import { D1BindingClient, prepareD1Operation } from "./d1-operations";
import {
  D1HttpClient,
  InMemoryReplayGuard,
  handleD1HttpRequest,
} from "./d1-http";
import type { D1DatabaseLike, D1PreparedStatement, D1Result } from "./types/binding";

function fakeDatabase() {
  const calls: Array<{ query: string; values: unknown[] }> = [];
  const database: D1DatabaseLike = {
    prepare(query): D1PreparedStatement {
      const values: unknown[] = [];
      const statement: D1PreparedStatement = {
        bind(...bound) {
          values.push(...bound);
          return statement;
        },
        async first<T>() {
          return { ok: 1 } as T;
        },
        async all<T>() {
          calls.push({ query, values });
          return { success: true, results: [{ ok: 1 } as T] };
        },
        async run<T>() {
          calls.push({ query, values });
          return { success: true, results: [], meta: { changes: 1 } } as D1Result<T>;
        },
      };
      return statement;
    },
    async batch<T>(statements: D1PreparedStatement[]) {
      return (await Promise.all(statements.map((statement) => statement.all<T>()))) as D1Result<T>[];
    },
  };
  return { database, calls };
}

describe("D1 persistence boundary", () => {
  it("only prepares allowlisted operations and uses native batch", async () => {
    const { database, calls } = fakeDatabase();
    const client = new D1BindingClient(database);
    await client.batch([
      { name: "health" },
      { name: "activityById", activityId: "activity-1" },
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0]?.query).toContain("SELECT 1");
    expect(calls[1]?.query).toContain("AND v.activityId = ?");
    expect(() =>
      prepareD1Operation(database, { name: "activityById", activityId: "a' OR 1=1" }),
    ).not.toThrow();
    expect(calls[1]?.values).toEqual(["activity-1"]);
  });

  it("authenticates, expires timestamps and rejects nonce replay", async () => {
    const { database } = fakeDatabase();
    const now = 1_700_000_000_000;
    const replayGuard = new InMemoryReplayGuard(() => now);
    const request = () =>
      new Request("https://d1-proxy.test", {
        method: "POST",
        headers: {
          authorization: "Bearer shared-secret",
          "content-type": "application/json",
          "x-d1-timestamp": String(now),
          "x-d1-nonce": "nonce-1",
        },
        body: JSON.stringify({ operation: { name: "health" } }),
      });
    const options = { database, sharedToken: "shared-secret", replayGuard, now: () => now };
    expect((await handleD1HttpRequest(request(), options)).status).toBe(200);
    expect((await handleD1HttpRequest(request(), options)).status).toBe(409);
    expect(
      (
        await handleD1HttpRequest(
          new Request("https://d1-proxy.test", {
            method: "POST",
            headers: {
              authorization: "Bearer shared-secret",
              "x-d1-timestamp": String(now - 600_001),
              "x-d1-nonce": "nonce-old",
            },
            body: JSON.stringify({ operation: { name: "health" } }),
          }),
          options,
        )
      ).status,
    ).toBe(401);
  });

  it("sends typed operations through HTTP without exposing SQL", async () => {
    const seen: Request[] = [];
    const client = new D1HttpClient({
      url: "https://d1-proxy.test",
      token: "shared-secret",
      now: () => 1_700_000_000_000,
      nonce: () => "nonce-client",
      fetch: async (_input, init) => {
        const request = new Request("https://d1-proxy.test", init);
        seen.push(request);
        return new Response(JSON.stringify({ success: true, results: [{ ok: 1 }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });
    await client.execute({ name: "health" });
    const body = await seen[0]?.json();
    expect(body).toEqual({ operation: { name: "health" } });
    expect(JSON.stringify(body)).not.toContain("SELECT");
  });

  it("supports bounded typed batches over HTTP", async () => {
    const client = new D1HttpClient({
      url: "https://d1-proxy.test",
      token: "shared-secret",
      now: () => 1_700_000_000_000,
      nonce: () => "nonce-batch",
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { operations: unknown[] };
        return new Response(JSON.stringify({
          results: body.operations.map(() => ({ success: true, results: [] })),
        }), { status: 200 });
      },
    });

    await expect(client.batch([{ name: "health" }, { name: "activeCatalogMetadata" }])).resolves.toHaveLength(2);
    await expect(client.batch([])).rejects.toMatchObject({
      message: expect.stringContaining("between 1 and 100"),
    });
  });
});

