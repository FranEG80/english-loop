import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { WordOrderRenderer } from "./WordOrderRenderer";

function activity(shuffledWords: string[], id = "word-order") {
  return {
    id,
    level: "B1" as const,
    taxonomyNodeId: "topic",
    interactionMode: "sentence_builder" as const,
    type: "word_order" as const,
    shuffledWords,
  };
}

function wordLabel(template: string, word: string) {
  return template.replace("{word}", word);
}

describe("WordOrderRenderer", () => {
  it("builds a linear sentence by tapping fragments in order", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WordOrderRenderer
        activity={activity(["a cat", "the garden.", "I saw", "in"])}
        dictionary={en}
        onSubmit={onSubmit}
      />,
    );

    const submit = screen.getByRole("button", { name: en.daily.submitAnswer });
    const sentence = screen.getByRole("region", {
      name: en.activities.wordOrderSentenceLabel,
    });
    expect(submit).toBeDisabled();
    expect(within(sentence).getByText(en.activities.wordOrderEmptyHint)).toBeInTheDocument();

    for (const fragment of ["I saw", "a cat", "in", "the garden."]) {
      await user.click(screen.getByRole("button", { name: fragment }));
    }

    expect(within(sentence).getByText("I saw")).toBeInTheDocument();
    expect(within(sentence).getByText("the garden.")).toBeInTheDocument();
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "ordered_list",
      value: ["I saw", "a cat", "in", "the garden."],
    });
  });

  it("uses earlier and later controls that follow the sentence direction", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WordOrderRenderer
        activity={activity(["went", "They"])}
        dictionary={en}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "went" }));
    await user.click(screen.getByRole("button", { name: "They" }));

    expect(
      screen.getByRole("button", {
        name: wordLabel(en.activities.moveEarlier, "went"),
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: wordLabel(en.activities.moveLater, "They"),
      }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: wordLabel(en.activities.moveEarlier, "They"),
      }),
    );
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "ordered_list",
      value: ["They", "went"],
    });
  });

  it("returns a fragment to the bank and prevents incomplete submissions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WordOrderRenderer
        activity={activity(["one", "two"])}
        dictionary={en}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "one" }));
    await user.click(
      screen.getByRole("button", {
        name: `${en.activities.removeWord}: one`,
      }),
    );

    expect(screen.getByRole("button", { name: "one" })).toBeEnabled();
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables every interaction when the activity is disabled", () => {
    const onSubmit = vi.fn();
    render(
      <WordOrderRenderer
        activity={activity(["one", "two"], "disabled")}
        dictionary={en}
        onSubmit={onSubmit}
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: "one" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "two" })).toBeDisabled();
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
