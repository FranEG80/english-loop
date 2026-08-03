/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { ActivityRenderer } from "./ActivityRenderer";

vi.mock("next/image", () => ({ default: ({ alt = "", ...props }: Record<string, unknown>) => <img {...props} alt={String(alt)} /> }));

const base = { id: "a", level: "B1" as const, taxonomyNodeId: "topic" };

describe("ActivityRenderer", () => {
  it.each([
    ["true_false", { type: "true_false", interactionMode: "swipe", statement: "True?" }],
    ["single_choice", { type: "single_choice", interactionMode: "standard", question: "Choose", options: [{ id: "a", label: "A" }] }],
    ["fill_blank", { type: "fill_blank", interactionMode: "standard", textWithGap: "Fill" }],
    ["sentence_transformation", { type: "sentence_transformation", interactionMode: "sentence_builder", originalSentence: "Original", instructionHint: "Build", wordBank: ["a"] }],
    ["matching", { type: "matching", interactionMode: "matching_pairs", leftItems: [{ id: "l", label: "Left" }], rightItems: [{ id: "r", label: "Right" }] }],
    ["word_order", { type: "word_order", interactionMode: "sentence_builder", shuffledWords: ["a"] }],
  ])("renders the %s interaction", (_type, activity) => {
    render(<ActivityRenderer activity={{ ...base, ...activity } as never} dictionary={en} onSubmit={vi.fn()} />);
    expect(document.querySelector("section")).toBeInTheDocument();
  });

  it("renders an accessible fallback for unsupported activity types", () => {
    render(<ActivityRenderer activity={{ ...base, type: "unsupported", interactionMode: "standard" } as never} dictionary={en} onSubmit={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
