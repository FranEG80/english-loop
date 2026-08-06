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

  it("extracts markdown content and omits empty optional sections", () => {
    const { rerender } = render(<DailyLessonView dictionary={en} lesson={{ level: "B1", category: "grammar", title: "Rewriting", summary: "Summary", explanation: "# Explicación\nKeep the meaning.\n\n# Ejemplos\n1. **It is cheaper.** — Es más barato.", commonMistakes: [], examples: [], id: "lesson-2", taxonomyNodeId: "grammar", tags: [], difficulty: 1, status: "new", relatedActivityIds: [] } as never} />);
    expect(screen.getByRole("heading", { name: "Explicación" })).toBeVisible();
    expect(screen.getByText("It is cheaper.")).toBeVisible();
    expect(screen.queryByRole("heading", { name: en.daily.commonMistakesTitle })).not.toBeInTheDocument();

    rerender(<DailyLessonView dictionary={en} lesson={{ level: "B1", category: "grammar", title: "Plain", summary: "Summary", explanation: "Plain explanation", commonMistakes: [], examples: [], id: "lesson-3", taxonomyNodeId: "grammar", tags: [], difficulty: 1, status: "new", relatedActivityIds: [] } as never} />);
    expect(screen.queryByRole("heading", { name: en.daily.examplesTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: en.daily.commonMistakesTitle })).not.toBeInTheDocument();
  });

  it("gives full width to the longest explanation sections automatically", () => {
    const detailedExplanation = Array.from(
      { length: 5 },
      () => "This detailed explanation gives enough context to understand the pattern and apply it correctly.",
    ).join("\n\n");
    render(<DailyLessonView dictionary={en} lesson={{ level: "B2", category: "grammar", title: "Reframing", summary: "Summary", explanation: `# Detailed explanation\n${detailedExplanation}\n\n# Main uses\n- Change the focus.\n- Express distance.\n- Reformulate causes.`, commonMistakes: [], examples: [], id: "lesson-4", taxonomyNodeId: "grammar", tags: [], difficulty: 2, status: "new", relatedActivityIds: [] } as never} />);

    expect(screen.getByRole("heading", { name: "Detailed explanation" }).closest("section"))
      .toHaveClass("lg:col-span-12");
    expect(screen.getByRole("heading", { name: "Main uses" }).closest("section"))
      .toHaveClass("lg:col-span-12");
  });

  it("uses asymmetric columns and expands an unpaired section", () => {
    const detailedPattern = "A detailed pattern with examples and exceptions. ".repeat(14);
    render(<DailyLessonView dictionary={en} lesson={{ level: "B2", category: "grammar", title: "Reframing", summary: "Summary", explanation: `# Objectives\n- First objective.\n- Second objective.\n\n# Explanation\nThis explanation is longer because it gives the context needed to understand the rule and apply it correctly in a sentence.\n\n# Structure\n- First form.\n- Second form.\n- Third form.\n\n# Detailed pattern\n${detailedPattern}`, commonMistakes: [], examples: [], id: "lesson-5", taxonomyNodeId: "grammar", tags: [], difficulty: 2, status: "new", relatedActivityIds: [] } as never} />);

    expect(screen.getByRole("heading", { name: "Objectives" }).closest("section"))
      .toHaveClass("lg:col-span-5");
    expect(screen.getByRole("heading", { name: "Explanation" }).closest("section"))
      .toHaveClass("lg:col-span-7");
    expect(screen.getByRole("heading", { name: "Structure" }).closest("section"))
      .toHaveClass("lg:col-span-12");
    expect(screen.getByRole("heading", { name: "Detailed pattern" }).closest("section"))
      .toHaveClass("lg:col-span-12");
  });
});
