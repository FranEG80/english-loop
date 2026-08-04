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

  it("renders and submits every single-gap text activity variant", async () => {
    const user = userEvent.setup();
    const cases = [
      { type: "error_correction" as const, sentenceWithError: "I has a book", expected: { kind: "text", value: "have" } },
      { type: "word_formation" as const, sentenceWithGap: "She is ___", baseWord: "HAPPY", expected: { kind: "text", value: "happy" } },
      { type: "key_word_transformation" as const, firstSentence: "I left", keyword: "AGO", secondSentenceStart: "It was", expected: { kind: "text", value: "two years ago" } },
      { type: "rewrite_sentence" as const, originalSentence: "They go", constraintHint: "Use the past", expected: { kind: "text", value: "They went" } },
    ];
    for (const item of cases) {
      const onSubmit = vi.fn();
      const { unmount } = render(<TextResponseRenderer activity={{ id: item.type, level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", ...item }} dictionary={en} onSubmit={onSubmit} />);
      await user.type(screen.getByRole("textbox", { name: en.activities.typeYourAnswer }), item.expected.value);
      await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
      expect(onSubmit).toHaveBeenCalledWith(item.expected);
      unmount();
    }
  });

  it("renders paragraphs and dialogues with multiple and optional gaps", async () => {
    const user = userEvent.setup();
    const paragraphSubmit = vi.fn();
    const paragraph = render(<TextResponseRenderer activity={{ id: "paragraph", level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", type: "complete_paragraph", paragraphWithGaps: "I ___ and ___", gapCount: 2 }} dictionary={en} onSubmit={paragraphSubmit} />);
    const paragraphInputs = screen.getAllByRole("textbox");
    await user.type(paragraphInputs[0]!, "read");
    await user.type(paragraphInputs[1]!, "write");
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(paragraphSubmit).toHaveBeenCalledWith({ kind: "ordered_list", value: ["read", "write"] });
    paragraph.unmount();

    const dialogueSubmit = vi.fn();
    render(<TextResponseRenderer activity={{ id: "dialogue", level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", type: "complete_dialogue", dialogueLines: [{ speaker: "A", text: "Hello", hasGap: false }, { speaker: "B", text: "", hasGap: true }] }} dictionary={en} onSubmit={dialogueSubmit} />);
    await user.type(screen.getByRole("textbox", { name: en.activities.gapHint.replace("{index}", "1") }), "Hi");
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(dialogueSubmit).toHaveBeenCalledWith({ kind: "text", value: "Hi" });
  });

  it("keeps disabled inputs and submit controls inactive", async () => {
    const onSubmit = vi.fn();
    render(<TextResponseRenderer activity={{ id: "disabled", level: "B1", taxonomyNodeId: "topic", interactionMode: "standard", type: "fill_blank", textWithGap: "I ___" }} dictionary={en} onSubmit={onSubmit} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
