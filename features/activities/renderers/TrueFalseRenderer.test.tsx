import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { TrueFalseRenderer } from "./TrueFalseRenderer";

describe("TrueFalseRenderer", () => {
  it("submits a single boolean after the animation delay", async () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    render(<TrueFalseRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "The statement" }} dictionary={en} onSubmit={onSubmit} />);
    screen.getByRole("button", { name: en.activities.trueLabel }).click();
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    expect(onSubmit).toHaveBeenCalledWith({ kind: "boolean", value: true });
    vi.useRealTimers();
  });

  it("submits all answers for a multi-card deck", async () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    render(<TrueFalseRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "One", statements: [{ id: "1", statement: "One" }, { id: "2", statement: "Two" }] }} dictionary={en} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    fireEvent.click(screen.getByRole("button", { name: en.activities.falseLabel }));
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    expect(onSubmit).toHaveBeenCalledWith({ kind: "boolean_list", value: [true, false] });
    vi.useRealTimers();
  });
});
