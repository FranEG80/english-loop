import { describe, expect, it } from "vitest";
import { listActivities } from "./list-activities";
import { catalog } from "@/test/support/core-fakes";

describe("listActivities", () => {
  it("supports both levels and lesson filters", async () => {
    const result = await listActivities(catalog, {
      level: "both",
      lessonIds: ["lesson-1"],
    });

    expect(result.map((item) => item.id)).toEqual(["activity-1", "activity-2"]);
  });
});
