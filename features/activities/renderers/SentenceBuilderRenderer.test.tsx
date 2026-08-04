import { fireEvent, render, screen } from "@testing-library/react";
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

  it("guards empty submissions, reset and disabled controls", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SentenceBuilderRenderer activity={{ id: "empty", level: "B1", taxonomyNodeId: "topic", interactionMode: "sentence_builder", type: "sentence_transformation", originalSentence: "They go", instructionHint: "Change the tense", wordBank: ["They"] }} dictionary={en} onSubmit={onSubmit} />);
    const submit = screen.getByRole("button", { name: en.daily.submitAnswer }) as HTMLButtonElement;
    submit.disabled = false;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "They" }));
    await user.click(screen.getByRole("button", { name: en.activities.resetSelection }));

    const disabledSubmit = vi.fn();
    render(<SentenceBuilderRenderer activity={{ id: "disabled", level: "B1", taxonomyNodeId: "topic", interactionMode: "sentence_builder", type: "sentence_transformation", originalSentence: "They go", instructionHint: "Change the tense", wordBank: ["They"] }} dictionary={en} onSubmit={disabledSubmit} disabled />);
    const disabledWord = screen.getAllByRole("button", { name: "They" })[1] as HTMLButtonElement;
    disabledWord.disabled = false;
    fireEvent.click(disabledWord);
    const disabledReset = screen.getAllByRole("button", { name: en.activities.resetSelection })[1] as HTMLButtonElement;
    disabledReset.disabled = false;
    fireEvent.click(disabledReset);
    expect(disabledSubmit).not.toHaveBeenCalled();
  });
});
