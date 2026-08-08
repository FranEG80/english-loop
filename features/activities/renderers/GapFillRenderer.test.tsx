import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { GapFillRenderer } from "./GapFillRenderer";
import type { GapFillActivityDto, KeyWordTransformationActivityDto } from "@/core/models";

function gapFill(overrides: Partial<GapFillActivityDto> = {}): GapFillActivityDto {
  return {
    id: "a1",
    level: "B1",
    taxonomyNodeId: "topic",
    type: "gap_fill",
    skillFocus: "fill_blank",
    presentation: "gap_fill",
    instructions: "Complete the sentence with one word.",
    layout: "sentence",
    gapIds: ["gap1"],
    segments: [
      { kind: "text", value: "I booked a return " },
      { kind: "gap", gapId: "gap1", position: 1 },
      { kind: "text", value: " to Leeds." },
    ],
    ...overrides,
  };
}

describe("GapFillRenderer", () => {
  it("pinta las instrucciones de la actividad", () => {
    render(<GapFillRenderer activity={gapFill()} dictionary={en} onSubmit={vi.fn()} />);
    expect(screen.getByText("Complete the sentence with one word.")).toBeInTheDocument();
  });

  it("pinta el hueco dentro de la frase, no en una caja aparte", () => {
    render(<GapFillRenderer activity={gapFill()} dictionary={en} onSubmit={vi.fn()} />);

    const input = screen.getByLabelText("Gap 1 of 1");
    const paragraph = input.closest("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph?.textContent).toContain("I booked a return");
    expect(paragraph?.textContent).toContain("to Leeds.");
  });

  it("emite una respuesta por hueco, casada por gapId", async () => {
    const onSubmit = vi.fn();
    render(<GapFillRenderer activity={gapFill()} dictionary={en} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Gap 1 of 1"), "  ticket ");
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "gaps",
      value: [{ gapId: "gap1", text: "ticket" }],
    });
  });

  it("numera los huecos y no deja enviar con alguno vacío", async () => {
    const onSubmit = vi.fn();
    render(
      <GapFillRenderer
        activity={gapFill({
          gapIds: ["gap1", "gap2"],
          segments: [
            { kind: "text", value: "There is " },
            { kind: "gap", gapId: "gap1", position: 1 },
            { kind: "text", value: " apple and " },
            { kind: "gap", gapId: "gap2", position: 2 },
            { kind: "text", value: " banana." },
          ],
        })}
        dictionary={en}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText("Gap 2 of 2")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Gap 1 of 2"), "an");
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Gap 2 of 2"), "a");
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: "gaps",
      value: [
        { gapId: "gap1", text: "an" },
        { gapId: "gap2", text: "a" },
      ],
    });
  });

  it("pinta los turnos de un diálogo con su hablante", () => {
    render(
      <GapFillRenderer
        activity={gapFill({
          layout: "dialogue",
          segments: [
            { kind: "speaker", label: "A" },
            { kind: "text", value: "Can you swim?" },
            { kind: "break" },
            { kind: "speaker", label: "B" },
            { kind: "text", value: "Yes, " },
            { kind: "gap", gapId: "gap1", position: 1 },
          ],
        })}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("Can you swim?")).toBeInTheDocument();
  });

  it("muestra la raíz de UoE Part 3 junto al hueco", () => {
    render(
      <GapFillRenderer
        activity={gapFill({ type: "word_formation", cueWord: "CONVINCE" })}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("CONVINCE")).toBeInTheDocument();
    expect(screen.getByText(en.activities.cueWordLabel)).toBeInTheDocument();
  });

  it("muestra la frase original y la clave en UoE Part 4", () => {
    const activity: KeyWordTransformationActivityDto = {
      id: "kwt",
      level: "B2",
      taxonomyNodeId: "topic",
      type: "key_word_transformation",
      skillFocus: "key_word_transformation",
      presentation: "key_word_transformation",
      instructions: "Complete the second sentence.",
      firstSentence: "I decided to stop smoking only 3 days ago.",
      keyWord: "GIVE",
      maxWords: 5,
      gapIds: ["gap1"],
      segments: [
        { kind: "text", value: "It was only 3 days ago that I made " },
        { kind: "gap", gapId: "gap1", position: 1 },
        { kind: "text", value: " smoking." },
      ],
    };

    render(<GapFillRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);

    expect(
      screen.getByText("I decided to stop smoking only 3 days ago."),
    ).toBeInTheDocument();
    expect(screen.getByText("GIVE")).toBeInTheDocument();
    expect(screen.getByText(/no contractions/iu)).toBeInTheDocument();
  });

  it("no envía cuando está deshabilitado", async () => {
    const onSubmit = vi.fn();
    render(
      <GapFillRenderer activity={gapFill()} dictionary={en} onSubmit={onSubmit} disabled />,
    );

    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
