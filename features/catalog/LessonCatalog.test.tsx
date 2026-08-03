import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { LessonCatalog } from "./LessonCatalog";

const lesson = { id: "lesson-1", level: "B1" as const, category: "grammar" as const, taxonomyNodeId: "grammar", tags: [], title: "Conditionals", summary: "Practice", difficulty: 2 as const, status: "new" as const };

describe("LessonCatalog", () => {
  it("renders an empty state when there are no lessons", () => {
    render(<LessonCatalog lessons={[]} dictionary={en} />);
    expect(screen.getByText(en.catalog.noResults)).toBeInTheDocument();
  });

  it("renders lesson metadata and links", () => {
    render(<LessonCatalog lessons={[lesson]} dictionary={en} />);
    expect(screen.getByRole("heading", { name: "Conditionals" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.catalog.openLesson })).toHaveAttribute("href", "/lessons/lesson-1");
  });
});
