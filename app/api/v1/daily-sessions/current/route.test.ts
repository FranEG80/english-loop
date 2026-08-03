import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, jsonRequest, resetApiRouteRoot } from "@/test/support/api-route-test";
import { GET, PUT } from "./route";

describe("/api/v1/daily-sessions/current", () => {
  beforeEach(() => resetApiRouteRoot());

  it("creates an idempotent session and retrieves it", async () => {
    const created = await expectJson(await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: "UTC" }, "PUT")));
    expect(created).toMatchObject({ status: "lesson", recommendedLessonId: "lesson-1" });
    expect(await expectJson(await GET())).toMatchObject({ id: created.id });
  });

  it("rejects malformed command payloads", async () => {
    expect((await PUT(jsonRequest("/api/v1/daily-sessions/current", { timezone: 3 }, "PUT"))).status).toBe(422);
  });
});
