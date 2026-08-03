import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("returns the liveness payload", async () => {
    expect(await (await GET()).json()).toEqual({ status: "ok" });
  });
});
