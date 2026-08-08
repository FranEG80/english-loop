import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { TrueFalseRenderer } from "./TrueFalseRenderer";
import type { TrueFalseActivityDto } from "@/core/models";

function activity(overrides: Partial<TrueFalseActivityDto> = {}): TrueFalseActivityDto {
  return {
    id: "a",
    level: "B1",
    taxonomyNodeId: "topic",
    type: "true_false",
    skillFocus: "true_false",
    presentation: "true_false",
    instructions: "Decide whether the statement is true.",
    statement: "The statement",
    ...overrides,
  };
}

describe("TrueFalseRenderer", () => {
  it("muestra la afirmación y las instrucciones", () => {
    render(<TrueFalseRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    expect(screen.getByText("The statement")).toBeInTheDocument();
    expect(screen.getByText("Decide whether the statement is true.")).toBeInTheDocument();
  });

  it("no pinta un mazo: el swipe es otra actividad", () => {
    render(<TrueFalseRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    expect(screen.queryByText(en.activities.swipeDeckTitle)).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
  });

  it("emite un booleano al pulsar cada botón", async () => {
    const onTrue = vi.fn();
    const { unmount } = render(
      <TrueFalseRenderer activity={activity()} dictionary={en} onSubmit={onTrue} />,
    );
    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    expect(onTrue).toHaveBeenCalledWith({ kind: "boolean", value: true });
    unmount();

    const onFalse = vi.fn();
    render(<TrueFalseRenderer activity={activity()} dictionary={en} onSubmit={onFalse} />);
    await userEvent.click(screen.getByRole("button", { name: en.activities.falseLabel }));
    expect(onFalse).toHaveBeenCalledWith({ kind: "boolean", value: false });
  });

  it("muestra el pasaje de contexto cuando lo hay", () => {
    render(
      <TrueFalseRenderer
        activity={activity({ context: "A shared shuttle connected older residents." })}
        dictionary={en}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("A shared shuttle connected older residents."),
    ).toBeInTheDocument();
  });

  it("deshabilita los botones cuando la actividad está bloqueada", async () => {
    const onSubmit = vi.fn();
    render(
      <TrueFalseRenderer activity={activity()} dictionary={en} onSubmit={onSubmit} disabled />,
    );

    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
