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
          return { success: true, results: [{ ok: 1 } as T], meta: { changes: 1 } };
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

  it("executes read, write and composite operations through the binding", async () => {
    const { database, calls } = fakeDatabase();
    const client = new D1BindingClient(database);
    await expect(client.execute({ name: "health" })).resolves.toMatchObject({ success: true });
    await expect(client.execute({ name: "savedLessonDelete", userId: "u1", lessonId: "l1" })).resolves.toMatchObject({ meta: { changes: 1 } });
    await expect(client.execute({ name: "dailySessionSave", snapshot: {
      id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: "now",
      lessons: [{ lessonId: "l1", order: 0, status: "pending", selectionReason: "new", completedAt: null }],
    } })).resolves.toMatchObject({ meta: { changes: 3 } });
    await expect(client.batch([])).resolves.toEqual([]);
    expect(calls.some(({ query }) => query.includes("DELETE FROM SavedLesson"))).toBe(true);
  });

  it("maps health, verification and replay result metadata to booleans", async () => {
    const { database } = fakeDatabase();
    const client = new D1BindingClient(database);
    await expect(client.health()).resolves.toBe(true);
    await expect(client.consumeVerification("id", "value", "now")).resolves.toBe(true);
    await expect(client.acceptReplayNonce("nonce", "now", "later")).resolves.toBe(true);
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

  it("rejects malformed HTTP requests before touching D1", async () => {
    const { database } = fakeDatabase();
    const now = 1_700_000_000_000;
    let nonce = 0;
    const baseHeaders = () => ({
      authorization: "Bearer shared-secret",
      "x-d1-timestamp": String(now),
      "x-d1-nonce": `invalid-${++nonce}`,
    });
    const options = { database, sharedToken: "shared-secret", replayGuard: { accept: async () => true }, now: () => now };
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "GET", headers: baseHeaders() }), options)).resolves.toMatchObject({ status: 405 });
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: { ...baseHeaders(), "x-d1-timestamp": "not-a-number" }, body: "{}" }), options)).resolves.toMatchObject({ status: 401 });
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: { ...baseHeaders(), authorization: "Basic wrong" }, body: "{}" }), options)).resolves.toMatchObject({ status: 401 });
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: { ...baseHeaders(), "content-length": "100" }, body: "{}" }), { ...options, maxBodyBytes: 10 })).resolves.toMatchObject({ status: 413 });
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: baseHeaders(), body: "not-json" }), options)).resolves.toMatchObject({ status: 400 });
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: baseHeaders(), body: JSON.stringify({ operation: { name: "not-allowed" } }) }), options)).resolves.toMatchObject({ status: 400 });
  });

  it("returns operation failures and reports unsuccessful batch results", async () => {
    const now = 1_700_000_000_000;
    const failingDatabase = { prepare: () => { throw new Error("database down"); }, batch: async () => [] } as never;
    const headers = { authorization: "Bearer shared-secret", "x-d1-timestamp": String(now), "x-d1-nonce": "failure-1" };
    const options = { database: failingDatabase, sharedToken: "shared-secret", replayGuard: { accept: async () => true }, now: () => now };
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers, body: JSON.stringify({ operation: { name: "health" } }) }), options)).resolves.toMatchObject({ status: 502 });

    const database: D1DatabaseLike = {
      prepare: () => ({ bind: () => database.prepare("unused"), first: async () => null, all: async () => ({ success: false, results: [] }), run: async () => ({ success: false, results: [] }) }) as never,
      batch: async () => [{ success: false, results: [] }],
    };
    await expect(handleD1HttpRequest(new Request("https://d1-proxy.test", { method: "POST", headers: { ...headers, "x-d1-nonce": "failure-2" }, body: JSON.stringify({ operations: [{ name: "health" }] }) }), { ...options, database })).resolves.toMatchObject({ status: 200 });
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

  it("uses default clock/nonce providers and surfaces HTTP errors", async () => {
    const defaulted = new D1HttpClient({
      url: "https://d1-proxy.test",
      token: "secret",
      fetch: async () => new Response(JSON.stringify({ success: true, results: [] }), { status: 200 }),
    });
    await expect(defaulted.execute({ name: "health" })).resolves.toMatchObject({ success: true });

    const failing = new D1HttpClient({
      url: "https://d1-proxy.test",
      token: "secret",
      now: () => 1,
      nonce: () => "error",
      fetch: async () => new Response(JSON.stringify({ error: "remote-failure" }), { status: 503 }),
    });
    await expect(failing.execute({ name: "health" })).rejects.toMatchObject({ message: "remote-failure" });
    await expect(failing.batch([{ name: "health" }])).rejects.toMatchObject({ message: "remote-failure" });
    await expect(failing.batch(Array.from({ length: 101 }, () => ({ name: "health" })))).rejects.toMatchObject({ message: expect.stringContaining("between 1 and 100") });
  });

  it("rejects a successful HTTP response without batch results", async () => {
    const client = new D1HttpClient({
      url: "https://d1-proxy.test",
      token: "secret",
      now: () => 1,
      nonce: () => "missing-results",
      fetch: async () => new Response(JSON.stringify({}), { status: 200 }),
    });
    await expect(client.batch([{ name: "health" }])).rejects.toMatchObject({ message: "D1 HTTP batch failed" });
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
