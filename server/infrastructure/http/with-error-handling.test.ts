// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/server/infrastructure/composition/composition-root", () => ({
  compositionRoot: {
    idGenerator: { generate: () => "request-id" },
    metrics: { recordRequest: vi.fn() },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  },
}));
vi.mock("@/server/infrastructure/config/config", () => ({
  config: { httpMaxRequestBodyBytes: 16, httpMaxResponseBodyBytes: 16 },
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

  it("rejects declared and streamed request bodies over the configured limit", async () => {
    const handler = vi.fn(async (request: Request) => {
      void request;
      return NextResponse.json({ ok: true });
    });
    const declared = await withErrorHandling(handler)(new Request("http://test.local", {
      method: "POST",
      headers: { "content-length": "17" },
      body: "small",
    }));
    expect(declared.status).toBe(413);
    expect(handler).not.toHaveBeenCalled();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("12345678901234567"));
        controller.close();
      },
    });
    const streamed = await withErrorHandling(async (request: Request) => {
      await request.text();
      return NextResponse.json({ ok: true });
    })(new Request("http://test.local", { method: "POST", body: stream, duplex: "half" } as RequestInit));
    expect(streamed.status).toBe(413);
  });

  it("rejects oversized responses without exposing their payload", async () => {
    const response = await withErrorHandling(async () => NextResponse.json({ value: "12345678901234567890" }))();
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { code: "RESPONSE_BODY_TOO_LARGE" } });
  });
});
