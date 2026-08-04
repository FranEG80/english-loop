import { describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ identity: {}, practiceRunRepository: {}, attemptRepository: {}, progressRepository: {}, reviewRepository: {}, unitOfWork: {}, idGenerator: {}, clock: { nowIso: vi.fn(() => "now") }, domainEventDispatcher: {}, metrics: {}, getDatasetVersion: vi.fn(async () => "v1"), getActivityCatalog: vi.fn(), getTaxonomyCatalog: vi.fn(), dailySessionRepository: {} }));
const calls = vi.hoisted(() => ({ create: vi.fn(async () => ({ run: { id: "run-1" } })), submit: vi.fn(async () => ({ attempt: { id: "attempt-1" } })), feedback: vi.fn(async () => ({ isCorrect: true })) }));
vi.mock("@/server/infrastructure/composition/composition-root", () => ({ compositionRoot: root }));
vi.mock("@/core/practice/application/use-cases/create-focused-practice-run", () => ({ createFocusedPracticeRun: calls.create }));
vi.mock("@/core/progress/application/use-cases/submit-attempt-transaction", () => ({ submitAttemptTransaction: calls.submit }));
vi.mock("@/core/practice/application/use-cases/get-attempt-feedback", () => ({ getAttemptFeedback: calls.feedback }));
vi.mock("@/core/practice/application/mappers/practice-run-mapper", () => ({ toPracticeRunDto: (run: unknown) => ({ mapped: run }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createPracticeRunAction, submitAttemptAction } from "./practice";

describe("app practice actions", () => {
  it("creates a run and returns its DTO", async () => {
    await expect(createPracticeRunAction({ taxonomyNodeId: "grammar", level: "B1", sessionSize: 5 })).resolves.toEqual({ mapped: { id: "run-1" } });
    expect(calls.create).toHaveBeenCalled();
  });

  it("submits an attempt and resolves feedback", async () => {
    await expect(submitAttemptAction({ runId: "run-1", activityId: "a1", idempotencyKey: "key", response: { kind: "boolean", value: true } })).resolves.toEqual({ isCorrect: true });
    expect(calls.feedback).toHaveBeenCalledWith(root.getActivityCatalog(), { id: "attempt-1" }, root.reviewRepository);
  });
});
