import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeeklyActivityChart } from "./WeeklyActivityChart";

describe("WeeklyActivityChart", () => {
  it("renders accessible bar data and localized heading", () => {
    render(<WeeklyActivityChart locale="en" data={[{ date: "2026-08-01", completedActivities: 3, accuracyRate: 0.66 }, { date: "2026-08-02", completedActivities: 0, accuracyRate: 0 }]} />);
    expect(screen.getByRole("heading", { name: "Completed activities" })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "2026-08-01: 3, 2026-08-02: 0");
    expect(screen.getByText(/3 in total/)).toBeInTheDocument();
  });
});
