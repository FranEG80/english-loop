import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { FeedbackPanel } from "./FeedbackPanel";

describe("FeedbackPanel", () => {
  it("shows positive feedback without exposing a correct answer block", () => {
    render(<FeedbackPanel feedback={{ attemptId: "attempt", activityId: "activity", submittedAt: "now", isCorrect: true, correctAnswer: "yes", normalizedResponse: { kind: "text", value: "yes" }, explanation: "Good", nextReviewAt: null }} dictionary={en} />);
    expect(screen.getByRole("status")).toHaveTextContent(en.daily.feedbackCorrect);
    expect(screen.getByRole("status")).toHaveTextContent(`${en.daily.explanationLabel}: Good`);
    expect(screen.queryByText(en.daily.correctAnswerLabel)).not.toBeInTheDocument();
  });

  it("shows the answer when feedback is incorrect", () => {
    render(<FeedbackPanel feedback={{ attemptId: "attempt", activityId: "activity", submittedAt: "now", isCorrect: false, correctAnswer: ["yes", "yep"], normalizedResponse: { kind: "text", value: "no" }, explanation: "Try again", nextReviewAt: "2026-08-05T00:00:00.000Z" }} dictionary={en} />);
    expect(screen.getByRole("status")).toHaveTextContent(en.daily.feedbackIncorrect);
    expect(screen.getByRole("status")).toHaveTextContent(`${en.daily.correctAnswerLabel}: yes, yep`);
  });
});
