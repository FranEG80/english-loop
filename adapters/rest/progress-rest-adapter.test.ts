import { afterEach, describe, expect, it, vi } from "vitest";
import { progressRestAdapter } from "./progress-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("progressRestAdapter", () => {
  it("maps every progress read endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await progressRestAdapter.getOverview();
    await progressRestAdapter.getReviewQueue();
    await progressRestAdapter.getTaxonomyProgress("topic");
    await progressRestAdapter.getActivityHistory("activity");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["/api/v1/progress/overview", "/api/v1/progress/review-queue", "/api/v1/progress/taxonomy/topic", "/api/v1/progress/activities/activity/history"]);
  });
});
