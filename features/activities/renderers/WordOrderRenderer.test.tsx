import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { WordOrderRenderer } from "./WordOrderRenderer";

describe("WordOrderRenderer", () => {
  it("moves words with keyboard-style controls and submits order", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<WordOrderRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "sentence_builder", type: "word_order", shuffledWords: ["went", "They"] }} dictionary={en} onSubmit={onSubmit} />);
    await user.click(screen.getAllByRole("button", { name: en.activities.moveDown })[0]);
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "ordered_list", value: ["They", "went"] });
  });
});
