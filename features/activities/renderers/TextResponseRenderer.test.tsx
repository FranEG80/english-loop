import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { TextResponseRenderer } from "./TextResponseRenderer";

describe("TextResponseRenderer", () => {
  it("requires a value before submitting a single text response", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextResponseRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", type: "fill_blank", textWithGap: "I ___ English" }} dictionary={en} onSubmit={onSubmit} />);
    const submit = screen.getByRole("button", { name: en.daily.submitAnswer });
    expect(submit).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: en.activities.typeYourAnswer }), "study");
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ kind: "text", value: "study" });
  });

  it("submits ordered values for multi-gap activities", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TextResponseRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", type: "open_cloze", textWithGaps: "I ___ to ___", gapCount: 2 }} dictionary={en} onSubmit={onSubmit} />);
    const boxes = screen.getAllByRole("textbox");
    await user.type(boxes[0], "want");
    await user.type(boxes[1], "learn");
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "ordered_list", value: ["want", "learn"] });
  });
});
