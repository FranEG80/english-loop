import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("notifies the enclosing form after updating its hidden value", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <DailyGoalStepper defaultValue={11} label="Daily activities" />
      </form>,
    );
    const form = container.querySelector("form");
    const handleChange = vi.fn();
    form?.addEventListener("change", handleChange);

    await user.click(
      screen.getByRole("button", { name: "Daily activities: +1" }),
    );

    expect(handleChange).toHaveBeenCalledOnce();
    expect(new FormData(form ?? undefined).get("dailyGoal")).toBe("12");
  });
});
