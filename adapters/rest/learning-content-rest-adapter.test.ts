import { afterEach, describe, expect, it, vi } from "vitest";
import { learningContentRestAdapter } from "./learning-content-rest-adapter";

afterEach(() => vi.unstubAllGlobals());

describe("learningContentRestAdapter", () => {
  it("serializes filters and resolves all catalog endpoints", async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ items: [], nextCursor: null, hasMore: false }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await learningContentRestAdapter.listLessons({ level: "B1", category: "grammar" });
    await learningContentRestAdapter.searchLessonsPage(
      { level: "B2", query: "key word" },
      { page: 2, pageSize: 12 },
    );
    await learningContentRestAdapter.getLessonById("lesson");
    await learningContentRestAdapter.listActivities({ level: "both", lessonIds: ["l1", "l2"] });
    await learningContentRestAdapter.searchActivitiesPage(
      { type: "key_word_transformation", interactionMode: "standard", query: "unless" },
      { page: 1, pageSize: 12 },
    );
    await learningContentRestAdapter.getActivityById("activity");
    await learningContentRestAdapter.getTaxonomyTree();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "/api/v1/lessons?level=B1&category=grammar",
      "/api/v1/lessons?level=B2&q=key+word&page=2&pageSize=12",
      "/api/v1/lessons/lesson",
      "/api/v1/activities?level=both&lessonIds=l1&lessonIds=l2",
      "/api/v1/activities?type=key_word_transformation&q=unless&interaction=standard&page=1&pageSize=12",
      "/api/v1/activities/activity",
      "/api/v1/practice-taxonomy",
    ]);
  });
});
