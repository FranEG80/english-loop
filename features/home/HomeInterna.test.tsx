import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { HomeInterna } from "./HomeInterna";

vi.mock("@/shared/layout/Mascot", () => ({ Mascot: () => <span aria-hidden="true" /> }));

describe("HomeInterna", () => {
  it("shows the user's recommendation, progress and quick links", () => {
    render(<HomeInterna dictionary={en} session={{ name: "Alex", email: "alex@example.com", activeLevels: ["B1"] } as never} dailySession={{ streakDays: 2, goal: { completedActivities: 2, targetActivities: 5 } } as never} lesson={{ title: "Future forms", summary: "Practice", level: "B1", category: "grammar", id: "lesson-1", taxonomyNodeId: "grammar", tags: [], difficulty: 1, status: "new" } as never} progress={{ accuracyRate: 0.8, pendingReviewCount: 1 } as never} />);
    expect(screen.getByRole("heading", { name: /Alex/ })).toBeInTheDocument();
    expect(screen.getByText("Future forms")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.home.goToDaily })).toHaveAttribute("href", "/daily");
  });
});
