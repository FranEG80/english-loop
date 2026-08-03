// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/server/infrastructure/composition/composition-root", () => ({
  compositionRoot: {
    idGenerator: { generate: () => "request-id" },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  },
}));

import { withErrorHandling } from "./with-error-handling";

describe("withErrorHandling", () => {
  it("preserves successful responses and maps thrown errors", async () => {
    const success = await withErrorHandling(async () => NextResponse.json({ ok: true }))();
    expect(success.status).toBe(200);
    const failure = await withErrorHandling(async () => { throw new Error("private details"); })();
    expect(failure.status).toBe(500);
    expect(await failure.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", fieldErrors: {}, requestId: "request-id" } });
  });
});
