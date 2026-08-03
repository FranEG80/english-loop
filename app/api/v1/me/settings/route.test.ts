import { beforeEach, describe, expect, it } from "vitest";
import { expectJson, resetApiRouteRoot, routeRequest } from "@/test/support/api-route-test";
import { GET, PATCH } from "./route";

describe("/api/v1/me/settings", () => {
  beforeEach(() => resetApiRouteRoot());

  it("gets and patches public settings", async () => {
    expect(await expectJson(await GET())).toMatchObject({ locale: "es", dailyGoal: 10 });
    expect(await expectJson(await PATCH(routeRequest("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: "en", dailyGoalActivities: 5 }) })))).toMatchObject({ locale: "en", dailyGoal: 5 });
  });

  it("rejects invalid settings payloads", async () => {
    expect((await PATCH(routeRequest("/api/v1/me/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ dailyGoalActivities: -1 }) }))).status).toBe(422);
  });
});
