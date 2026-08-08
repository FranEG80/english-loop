import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { es } from "@/shared/i18n/dictionaries/es";
import type { AttemptFeedbackDto } from "@/core/models";
import { FeedbackPanel } from "./FeedbackPanel";

function feedbackWith(overrides: Partial<AttemptFeedbackDto>): AttemptFeedbackDto {
  return {
    attemptId: "preview",
    activityId: "activity-1",
    isCorrect: false,
    score: 0,
    correctAnswer: "make a decision",
    normalizedResponse: { kind: "single", value: "b" },
    items: [],
    explanation: "La colocación natural es «make a decision».",
    nextReviewAt: null,
    submittedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe("FeedbackPanel", () => {
  it("muestra la respuesta correcta legible cuando hay un solo ítem", () => {
    render(<FeedbackPanel feedback={feedbackWith({})} dictionary={es} />);

    expect(screen.getAllByText(/make a decision/).length).toBeGreaterThan(0);
  });

  it("traduce los booleanos del evaluador al idioma del alumno", () => {
    render(
      <FeedbackPanel feedback={feedbackWith({ correctAnswer: "true" })} dictionary={es} />,
    );

    expect(screen.getByText(es.activities.trueLabel)).toBeInTheDocument();
    expect(screen.queryByText("true")).not.toBeInTheDocument();
  });

  // Regresión: con varias rondas la respuesta correcta no cabe en una línea y
  // salía como «a, a, a, a». Ahora se explica ronda a ronda.
  it("lista todos los errores con su explicación cuando hay sub-ítems", () => {
    render(
      <FeedbackPanel
        feedback={feedbackWith({
          score: 0.5,
          correctAnswer: [],
          items: [
            {
              itemId: "r1",
              label: "Ronda 1",
              given: "pay attention",
              expected: ["get permission"],
              isCorrect: false,
              feedback: "«Pay attention» no se usa con permisos.",
            },
            {
              itemId: "r2",
              label: "Ronda 2",
              given: "get permission",
              expected: ["get permission"],
              isCorrect: true,
            },
          ],
        })}
        dictionary={es}
      />,
    );

    expect(screen.getByText("1 de 2 correctas")).toBeInTheDocument();
    expect(screen.getByText("Ronda 1")).toBeInTheDocument();
    expect(screen.getAllByText("get permission").length).toBe(2);
    expect(screen.getByText("«Pay attention» no se usa con permisos.")).toBeInTheDocument();
  });

  it("marca como sin responder un sub-ítem vacío", () => {
    render(
      <FeedbackPanel
        feedback={feedbackWith({
          correctAnswer: [],
          items: [
            { itemId: "a", label: "Opción A", given: "", expected: ["A"], isCorrect: false },
            { itemId: "b", label: "Opción B", given: "B", expected: ["B"], isCorrect: true },
          ],
        })}
        dictionary={es}
      />,
    );

    expect(screen.getByText(es.daily.breakdownEmpty)).toBeInTheDocument();
  });

  it("no revienta con un intento sin desglose guardado", () => {
    const legacy = { ...feedbackWith({}), items: undefined } as unknown as AttemptFeedbackDto;

    expect(() => render(<FeedbackPanel feedback={legacy} dictionary={es} />)).not.toThrow();
  });
});
