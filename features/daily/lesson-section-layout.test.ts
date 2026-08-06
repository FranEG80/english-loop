import type { LessonContentSection } from "@/core/content/domain/lesson-markdown";
import { describe, expect, it } from "vitest";
import { getLessonSectionPlacements } from "./lesson-section-layout";

function section(title: string, text: string): LessonContentSection {
  return {
    title,
    blocks: [{ type: "paragraph", text }],
  };
}

describe("getLessonSectionWidths", () => {
  it("marks substantial sections close to the longest one as full width", () => {
    const detailed = section("Detailed explanation", "context ".repeat(90));
    const almostAsDetailed = section("Pattern", "pattern ".repeat(70));
    const short = section("Main uses", "use ".repeat(12));

    expect(getLessonSectionPlacements([detailed, almostAsDetailed, short])).toEqual([
      "full",
      "full",
      "full",
    ]);
  });

  it("balances later cards across the asymmetric columns", () => {
    const sections = [
      section("First", "short ".repeat(10)),
      section("Second", "longer ".repeat(20)),
      section("Third", "short ".repeat(12)),
      section("Fourth", "longer ".repeat(25)),
    ];

    expect(getLessonSectionPlacements(sections)).toEqual([
      "left",
      "right",
      "right",
      "left",
    ]);
  });

  it("promotes an unpaired compact section to avoid an empty column", () => {
    const sections = [
      section("First", "short ".repeat(10)),
      section("Second", "longer ".repeat(20)),
      section("Third", "short ".repeat(12)),
    ];

    expect(getLessonSectionPlacements(sections)).toEqual([
      "left",
      "right",
      "full",
    ]);
  });

  it("uses the full grid when there is only one content section", () => {
    expect(getLessonSectionPlacements([section("Explanation", "One idea.")])).toEqual([
      "full",
    ]);
  });
});
