import { describe, expect, it } from "vitest";
import { createD1Transport } from "./d1-runtime";
import type { D1DatabaseLike, D1PreparedStatement } from "./types/binding";

function fakeDatabase(): D1DatabaseLike {
  return {
    prepare(): D1PreparedStatement {
      const statement: D1PreparedStatement = {
        bind: () => statement,
        first: async <T>() => ({ ok: 1 }) as T,
        all: async <T>() => ({ success: true, results: [{ ok: 1 }] }) as { success: true; results: T[] },
        run: async <T>() => ({ success: true, results: [], meta: { changes: 1 } }) as { success: true; results: T[]; meta: { changes: number } },
      };
      return statement;
    },
    batch: async (statements) =>
      Promise.all(statements.map(async () => ({ success: true, results: [] }))),
  };
}

describe("createD1Transport", () => {
  it("uses the native binding when deployed on Cloudflare", async () => {
    const client = createD1Transport({
      databaseProvider: "d1",
      d1Transport: "binding",
      d1HttpUrl: null,
      d1HttpToken: null,
      binding: { DB: fakeDatabase() },
    });

    expect(client).not.toBeNull();
    await expect(client?.execute({ name: "health" })).resolves.toMatchObject({
      success: true,
    });
  });

  it("uses the authenticated HTTP client for a Vercel deployment", async () => {
    let received: Request | undefined;
    const client = createD1Transport({
      databaseProvider: "d1",
      d1Transport: "http",
      d1HttpUrl: "https://d1-proxy.example.test",
      d1HttpToken: "shared-secret",
      now: () => 1_700_000_000_000,
      nonce: () => "nonce-1",
      fetch: async (_input, init) => {
        received = new Request("https://d1-proxy.example.test", init);
        return new Response(JSON.stringify({ success: true, results: [] }));
      },
    });

    await client?.execute({ name: "health" });
    expect(received?.headers.get("authorization")).toBe("Bearer shared-secret");
    expect(received?.headers.get("x-d1-nonce")).toBe("nonce-1");
  });

  it("does not create a D1 client for another provider", () => {
    expect(
      createD1Transport({
        databaseProvider: "sqlite",
        d1Transport: "http",
        d1HttpUrl: null,
        d1HttpToken: null,
      }),
    ).toBeNull();
  });

  it("fails explicitly instead of falling back when a selected transport is incomplete", () => {
    expect(() =>
      createD1Transport({
        databaseProvider: "d1",
        d1Transport: "binding",
        d1HttpUrl: null,
        d1HttpToken: null,
      }),
    ).toThrow("Cloudflare D1 binding named DB");

    expect(() =>
      createD1Transport({
        databaseProvider: "d1",
        d1Transport: "http",
        d1HttpUrl: null,
        d1HttpToken: "shared-secret",
      }),
    ).toThrow("D1_HTTP_URL");

    expect(() =>
      createD1Transport({
        databaseProvider: "d1",
        d1Transport: "http",
        d1HttpUrl: "https://d1-proxy.example.test",
        d1HttpToken: null,
      }),
    ).toThrow("D1_HTTP_TOKEN");
  });
});
