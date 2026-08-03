import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { SentenceBuilderRenderer } from "./SentenceBuilderRenderer";

describe("SentenceBuilderRenderer", () => {
  it("builds, removes and submits a word sequence", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SentenceBuilderRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "sentence_builder", type: "sentence_transformation", originalSentence: "They go", instructionHint: "Change the tense", wordBank: ["They", "went"] }} dictionary={en} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "They" }));
    await user.click(screen.getByRole("button", { name: "went" }));
    await user.click(screen.getByRole("button", { name: `${en.activities.removeWord}: They` }));
    await user.click(screen.getByRole("button", { name: "They" }));
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "ordered_list", value: ["went", "They"] });
  });
});
