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

  it("preserves the public API error instead of replacing it with a generic status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: {
              code: "INSUFFICIENT_ACTIVITIES_FOR_SCOPE",
              message: "There are not enough activities for this selection yet.",
              fieldErrors: {},
            },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(restRequest("/practice-runs")).rejects.toMatchObject({
      name: "RestApiError",
      status: 400,
      code: "INSUFFICIENT_ACTIVITIES_FOR_SCOPE",
      message: "There are not enough activities for this selection yet.",
    });
  });
});
