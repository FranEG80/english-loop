import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { DailySummaryView } from "./DailySummaryView";

vi.mock("@/shared/layout/Mascot", () => ({ Mascot: () => <span aria-hidden="true" /> }));

describe("DailySummaryView", () => {
  it("shows scores and resolves nested taxonomy labels", () => {
    render(<DailySummaryView dictionary={en} locale="en" dailySession={{ streakDays: 3 } as never} progress={{ pendingReviewCount: 2, strongTopicIds: ["child"], weakTopicIds: ["missing"] } as never} taxonomyTree={[{ id: "root", label: { en: "Root", es: "Raíz" }, children: [{ id: "child", label: { en: "Child", es: "Hijo" }, children: [] }] } as never]} correctCount={4} incorrectCount={1} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByText("missing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.daily.summaryBackHome })).toHaveAttribute("href", "/dashboard");
  });
});
