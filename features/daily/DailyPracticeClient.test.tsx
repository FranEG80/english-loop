import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

const actions = vi.hoisted(() => ({ submitDailyAttemptAction: vi.fn(), completeDailySessionAction: vi.fn() }));
vi.mock("./actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/activities/ActivityRenderer", () => ({ ActivityRenderer: ({ onSubmit }: { onSubmit: (value: unknown) => void }) => <button type="button" onClick={() => onSubmit({ kind: "boolean", value: true })}>Answer</button> }));

import { DailyPracticeClient } from "./DailyPracticeClient";

describe("DailyPracticeClient", () => {
  it("submits an answer and displays the feedback panel", async () => {
    actions.submitDailyAttemptAction.mockResolvedValueOnce({ attemptId: "a", activityId: "activity-1", submittedAt: "now", isCorrect: true, explanation: "Good" });
    render(<DailyPracticeClient sessionId="session-1" activities={[{ id: "activity-1", level: "B1", taxonomyNodeId: "grammar", type: "true_false", skillFocus: "true_false", presentation: "true_false", instructions: "Decide.", statement: "True?" } as never]} dictionary={en} />);
    fireEvent.click(screen.getByRole("button", { name: "Answer" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(actions.submitDailyAttemptAction).toHaveBeenCalledWith("session-1", {
      activityId: "activity-1",
      idempotencyKey: "session-1:0",
      response: { kind: "boolean", value: true },
    });
    expect(screen.getByRole("button", { name: en.daily.finishSession })).toBeInTheDocument();
  });
});
