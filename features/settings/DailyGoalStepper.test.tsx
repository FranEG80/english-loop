import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DailyGoalStepper } from "./DailyGoalStepper";

describe("DailyGoalStepper", () => {
  it("increments and decrements within the supported range", async () => {
    const user = userEvent.setup();
    render(<DailyGoalStepper defaultValue={2} label="Daily activities" />);
    expect(document.querySelector("output")).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Daily activities: +1" }));
    expect(document.querySelector("output")).toHaveTextContent("3");
    await user.click(screen.getByRole("button", { name: "Daily activities: -1" }));
    expect(document.querySelector("output")).toHaveTextContent("2");
  });

  it("clamps the initial value at both boundaries", () => {
    const { unmount } = render(<DailyGoalStepper defaultValue={1} label="Goal" />);
    expect(screen.getByRole("button", { name: "Goal: -1" })).toBeDisabled();
    unmount();
    render(<DailyGoalStepper defaultValue={20} label="Goal" />);
    expect(screen.getByRole("button", { name: "Goal: +1" })).toBeDisabled();
  });
});
