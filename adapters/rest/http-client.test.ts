import { afterEach, describe, expect, it, vi } from "vitest";
import { restRequest, RestApiError } from "./http-client";

afterEach(() => vi.unstubAllGlobals());

describe("restRequest", () => {
  it("returns empty 204 responses and maps non-2xx responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(restRequest<void>("/empty")).resolves.toBeUndefined();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 503 })));
    await expect(restRequest("/broken")).rejects.toBeInstanceOf(RestApiError);
    await expect(restRequest("/broken")).rejects.toMatchObject({ status: 503 });
  });
});
