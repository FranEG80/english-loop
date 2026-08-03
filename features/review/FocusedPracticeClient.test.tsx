import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

const submit = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("./actions", () => ({ submitFocusedAttemptAction: submit }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/features/activities/ActivityRenderer", () => ({ ActivityRenderer: ({ onSubmit }: { onSubmit: (value: unknown) => void }) => <button type="button" onClick={() => onSubmit({ kind: "boolean", value: true })}>Answer</button> }));

import { FocusedPracticeClient } from "./FocusedPracticeClient";

describe("FocusedPracticeClient", () => {
  it("shows feedback after submitting an activity", async () => {
    submit.mockResolvedValueOnce({ attemptId: "a", activityId: "activity-1", submittedAt: "now", isCorrect: false, correctAnswer: "yes", explanation: "Try" });
    render(<FocusedPracticeClient runId="run-1" activities={[{ id: "activity-1", level: "B1", taxonomyNodeId: "grammar", type: "true_false", interactionMode: "swipe", statement: "True?" } as never]} dictionary={en} />);
    fireEvent.click(screen.getByRole("button", { name: "Answer" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: en.daily.finishSession })).toBeInTheDocument();
  });
});
