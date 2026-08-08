import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ACTIVITY_PRESENTATIONS } from "@/core/models";
import type { ActivityQuestionDto } from "@/core/models";
import { en } from "@/shared/i18n/dictionaries/en";
import { ActivityRenderer } from "./ActivityRenderer";

const base = {
  id: "activity-1",
  level: "B1" as const,
  taxonomyNodeId: "grammar",
  instructions: "Follow the instructions.",
};

/** Una actividad mínima por familia de presentación. */
const byPresentation: Record<string, ActivityQuestionDto> = {
  gap_fill: {
    ...base,
    type: "gap_fill",
    skillFocus: "fill_blank",
    presentation: "gap_fill",
    layout: "sentence",
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "I booked a " },
      { kind: "gap", gapId: "gap1", position: 1 },
    ],
  },
  key_word_transformation: {
    ...base,
    type: "key_word_transformation",
    skillFocus: "key_word_transformation",
    presentation: "key_word_transformation",
    firstSentence: "I stopped smoking.",
    keyWord: "GIVE",
    maxWords: 5,
    gapIds: ["gap1"],
    segments: [{ kind: "gap", gapId: "gap1", position: 1 }],
  },
  choice: {
    ...base,
    type: "single_choice",
    skillFocus: "single_choice",
    presentation: "choice",
    question: "Choose",
    selection: "single",
    options: [{ id: "a", label: "A" }],
  },
  true_false: {
    ...base,
    type: "true_false",
    skillFocus: "true_false",
    presentation: "true_false",
    statement: "True?",
  },
  swipe_deck: {
    ...base,
    type: "swipe_deck",
    skillFocus: "swipe_deck",
    presentation: "swipe_deck",
    cards: [
      { id: "c1", statement: "One" },
      { id: "c2", statement: "Two" },
    ],
  },
  word_order: {
    ...base,
    type: "word_order",
    skillFocus: "word_order",
    presentation: "word_order",
    tokens: [
      { id: "t1", text: "I" },
      { id: "t2", text: "agree" },
    ],
  },
  matching: {
    ...base,
    type: "matching",
    skillFocus: "matching",
    presentation: "matching",
    leftItems: [{ id: "l1", label: "Left" }],
    rightItems: [{ id: "r1", label: "Right" }],
  },
  free_text: {
    ...base,
    type: "error_correction",
    skillFocus: "error_correction",
    presentation: "free_text",
    prompt: "She go to work.",
  },
  mini_game: {
    ...base,
    type: "mini_game",
    skillFocus: "mini_game",
    presentation: "mini_game",
    game: "frog_leap",
    rounds: [
      {
        id: "r1",
        prompt: "Which one?",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
      },
    ],
  },
};

describe("ActivityRenderer", () => {
  it.each(ACTIVITY_PRESENTATIONS)("pinta la presentación %s", (presentation) => {
    const activity = byPresentation[presentation];
    expect(activity, `falta fixture para ${presentation}`).toBeDefined();

    const { unmount } = render(
      <ActivityRenderer activity={activity!} dictionary={en} onSubmit={vi.fn()} />,
    );
    expect(screen.getByText(en.activities.yourTurnLabel)).toBeInTheDocument();
    unmount();
  });

  it.each(ACTIVITY_PRESENTATIONS)("muestra las instrucciones en %s", (presentation) => {
    const { unmount } = render(
      <ActivityRenderer
        activity={byPresentation[presentation]!}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("Follow the instructions.")).toBeInTheDocument();
    unmount();
  });

  it("etiqueta la actividad con su tipo traducido, no con el identificador interno", () => {
    render(
      <ActivityRenderer
        activity={byPresentation.gap_fill!}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(en.activityTypes.gap_fill)).toBeInTheDocument();
    expect(screen.queryByText("gap_fill")).not.toBeInTheDocument();
  });

  it("da todo el ancho a las presentaciones que lo necesitan", () => {
    const { container, unmount } = render(
      <ActivityRenderer
        activity={byPresentation.word_order!}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );
    expect(container.querySelector("aside")).toBeNull();
    unmount();

    const { container: narrow } = render(
      <ActivityRenderer
        activity={byPresentation.choice!}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );
    expect(narrow.querySelector("aside")).not.toBeNull();
  });

  it("no recorta el mazo deslizable, que sale volando de la tarjeta", () => {
    const { container } = render(
      <ActivityRenderer
        activity={byPresentation.swipe_deck!}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );

    const section = container.querySelector("section");
    expect(section?.className).toContain("overflow-visible");
  });

  it("falla de forma explícita ante una presentación desconocida", () => {
    expect(() =>
      render(
        <ActivityRenderer
          activity={{ ...base, presentation: "unknown" } as never}
          dictionary={en}
          onSubmit={vi.fn()}
        />,
      ),
    ).toThrow(/sin renderer/u);
  });
});
