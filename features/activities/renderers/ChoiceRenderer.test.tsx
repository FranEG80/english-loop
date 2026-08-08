import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { ChoiceRenderer } from "./ChoiceRenderer";
import type { ChoiceActivityDto } from "@/core/models";

function activity(overrides: Partial<ChoiceActivityDto> = {}): ChoiceActivityDto {
  return {
    id: "a1",
    level: "B1",
    taxonomyNodeId: "topic",
    type: "single_choice",
    skillFocus: "single_choice",
    presentation: "choice",
    instructions: "Choose the correct option.",
    question: "Pick one",
    selection: "single",
    options: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma" },
    ],
    ...overrides,
  };
}

const multiple = activity({
  type: "multiple_choice",
  skillFocus: "multiple_select",
  selection: "multiple",
  question: "Pick several",
});

describe("ChoiceRenderer", () => {
  it("muestra las instrucciones y la pregunta", () => {
    render(<ChoiceRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    expect(screen.getByText("Choose the correct option.")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("usa radiogroup en selección única y group en múltiple", () => {
    const { unmount } = render(
      <ChoiceRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    unmount();

    render(<ChoiceRenderer activity={multiple} dictionary={en} onSubmit={vi.fn()} />);
    expect(screen.getByRole("group", { name: "Pick several" })).toBeInTheDocument();
  });

  it("emite una sola opción en selección única", async () => {
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={activity()} dictionary={en} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("radio", { name: /Beta/u }));
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({ kind: "single", value: "b" });
  });

  it("sustituye la selección anterior en selección única", async () => {
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={activity()} dictionary={en} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("radio", { name: /Alpha/u }));
    await userEvent.click(screen.getByRole("radio", { name: /Gamma/u }));
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({ kind: "single", value: "c" });
  });

  it("recorre las opciones con las flechas", async () => {
    render(<ChoiceRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: /Beta/u })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("acumula y quita opciones en selección múltiple", async () => {
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={multiple} dictionary={en} onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox", { name: /Alpha/u }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Gamma/u }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Alpha/u }));
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({ kind: "multiple", value: ["c"] });
  });

  it("numera las opciones con letras", () => {
    render(<ChoiceRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("no envía cuando está deshabilitado", async () => {
    const onSubmit = vi.fn();
    render(
      <ChoiceRenderer activity={activity()} dictionary={en} onSubmit={onSubmit} disabled />,
    );

    await userEvent.click(screen.getByRole("radio", { name: /Alpha/u }));
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
