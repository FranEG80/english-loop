/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { DailyLessonView } from "./DailyLessonView";

vi.mock("next/image", () => ({ default: ({ alt = "", ...props }: Record<string, unknown>) => <img {...props} alt={String(alt)} /> }));
vi.mock("@/shared/layout/Mascot", () => ({ Mascot: () => <span aria-hidden="true" /> }));

describe("DailyLessonView", () => {
  it("renders explanation, mistakes, examples and activity links", () => {
    render(<DailyLessonView dictionary={en} lesson={{ level: "B1", category: "grammar", title: "Future forms", summary: "Summary", explanation: "Explanation", commonMistakes: ["Mistake"], examples: [{ english: "I will go", translationEs: "Iré" }], id: "lesson-1", taxonomyNodeId: "grammar", tags: [], difficulty: 1, status: "new", relatedActivityIds: ["a1"] } as never} />);
    expect(screen.getByRole("heading", { name: "Future forms" })).toBeInTheDocument();
    expect(screen.getAllByText("Explanation")).toHaveLength(2);
    expect(screen.getByText("Mistake")).toBeInTheDocument();
    expect(screen.getByText("I will go")).toBeInTheDocument();
  });
});
