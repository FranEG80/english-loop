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

  it("supports right and left swipes and ignores short drags", async () => {
    vi.useFakeTimers();
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
    const onSubmit = vi.fn();
    const first = render(<TrueFalseRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Swipe me" }} dictionary={en} onSubmit={onSubmit} />);
    const card = screen.getByRole("group");
    fireEvent.pointerDown(card, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 110, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 110, pointerId: 1 });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.pointerDown(card, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 190, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 190, pointerId: 1 });
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    expect(onSubmit).toHaveBeenCalledWith({ kind: "boolean", value: true });
    first.unmount();
    vi.useRealTimers();

    vi.useFakeTimers();
    const leftSubmit = vi.fn();
    render(<TrueFalseRenderer activity={{ id: "b", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Swipe left" }} dictionary={en} onSubmit={leftSubmit} />);
    const leftCard = screen.getByRole("group", { name: "1 / 1" });
    fireEvent.pointerDown(leftCard, { clientX: 200, pointerId: 2 });
    fireEvent.pointerMove(leftCard, { clientX: 100, pointerId: 2 });
    fireEvent.pointerUp(leftCard, { clientX: 100, pointerId: 2 });
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    expect(leftSubmit).toHaveBeenCalledWith({ kind: "boolean", value: false });
    vi.useRealTimers();
  });

  it("does not answer disabled cards or answer twice during the exit animation", async () => {
    vi.useFakeTimers();
    const disabledSubmit = vi.fn();
    const disabled = render(<TrueFalseRenderer activity={{ id: "disabled", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Disabled" }} dictionary={en} onSubmit={disabledSubmit} disabled />);
    await act(async () => { screen.getByRole("button", { name: en.activities.trueLabel }).click(); });
    expect(disabledSubmit).not.toHaveBeenCalled();
    disabled.unmount();
    const activeSubmit = vi.fn();
    render(<TrueFalseRenderer activity={{ id: "active", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Active" }} dictionary={en} onSubmit={activeSubmit} />);
    const buttons = screen.getAllByRole("button", { name: en.activities.trueLabel });
    buttons[buttons.length - 1]!.click();
    buttons[buttons.length - 1]!.click();
    await act(async () => { await vi.advanceTimersByTimeAsync(220); });
    expect(activeSubmit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("ignores pointer events without a drag and while disabled", () => {
    const onSubmit = vi.fn();
    const active = render(<TrueFalseRenderer activity={{ id: "pointer", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Pointer" }} dictionary={en} onSubmit={onSubmit} />);
    const card = screen.getByRole("group");
    fireEvent.pointerUp(card);
    expect(onSubmit).not.toHaveBeenCalled();
    active.unmount();

    render(<TrueFalseRenderer activity={{ id: "disabled-pointer", level: "B1", taxonomyNodeId: "topic", interactionMode: "swipe", type: "true_false", statement: "Disabled pointer" }} dictionary={en} onSubmit={onSubmit} disabled />);
    const disabledCard = screen.getByRole("group");
    fireEvent.pointerDown(disabledCard, { clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(disabledCard, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(disabledCard, { clientX: 100, pointerId: 1 });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
