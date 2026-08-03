import { describe, expect, it } from "vitest";
import { PracticeRun } from "../../domain/practice-run";
import { toPracticeRunDto, toPracticeRunSummaryDto } from "./practice-run-mapper";

function run() {
  return PracticeRun.create({
    id: "run-1",
    userId: "user-1",
    mode: "FOCUSED",
    scope: { level: "B1", taxonomyNodeId: "topic", taxonomyPath: ["root", "topic"], descendantIds: ["topic"], requestedCount: 5 },
    activityIds: ["a1", "a2"],
    currentIndex: 1,
    status: "in_progress",
    datasetVersion: "v1",
    dailySessionId: null,
    createdAt: "2026-08-04T00:00:00.000Z",
  });
}

describe("practice run mappers", () => {
  it("maps a run without persistence-only fields", () => {
    expect(toPracticeRunDto(run())).toEqual({
      id: "run-1",
      scope: { taxonomyNodeId: "topic", taxonomyPath: ["root", "topic"], level: "B1" },
      activityIds: ["a1", "a2"],
      currentIndex: 1,
      status: "in_progress",
    });
  });

  it("maps summary counts and covered subtopics", () => {
    expect(toPracticeRunSummaryDto(run(), 3, 1, ["topic"])).toMatchObject({ runId: "run-1", correctCount: 3, incorrectCount: 1, coveredSubtopicIds: ["topic"] });
  });
});
