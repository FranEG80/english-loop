import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { WordOrderRenderer } from "./WordOrderRenderer";
import type { WordOrderActivityDto } from "@/core/models";

const activity: WordOrderActivityDto = {
  id: "wo",
  level: "B1",
  taxonomyNodeId: "topic",
  type: "word_order",
  skillFocus: "word_order",
  presentation: "word_order",
  instructions: "Put the fragments in the correct order.",
  tokens: [
    { id: "t2", text: "was sleeping" },
    { id: "t1", text: "The cat" },
    { id: "t3", text: "on the sofa." },
  ],
};

async function build(order: string[]) {
  for (const text of order) {
    await userEvent.click(screen.getByRole("button", { name: `Add ${text} to the sentence` }));
  }
}

describe("WordOrderRenderer", () => {
  it("pinta las instrucciones de la actividad, nunca la solución", () => {
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);

    expect(screen.getByText("Put the fragments in the correct order.")).toBeInTheDocument();
    expect(screen.queryByText("The cat was sleeping on the sofa.")).not.toBeInTheDocument();
  });

  it("no muestra botones de flecha ni de borrar por ficha", async () => {
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);
    await build(["The cat"]);

    expect(screen.queryByRole("button", { name: /move .* earlier/iu })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /move .* later/iu })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /drag .* to reorder/iu })).not.toBeInTheDocument();
  });

  it("pulsar una ficha del banco la lleva a la frase y al revés", async () => {
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);

    await build(["The cat"]);
    const placed = screen.getByRole("button", {
      name: "Remove The cat from the sentence",
    });
    expect(placed).toBeInTheDocument();

    await userEvent.click(placed);
    expect(
      screen.getByRole("button", { name: "Add The cat to the sentence" }),
    ).toBeInTheDocument();
  });

  it("emite los IDs de los fragmentos, no su texto", async () => {
    const onSubmit = vi.fn();
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={onSubmit} />);

    await build(["The cat", "was sleeping", "on the sofa."]);
    await userEvent.click(screen.getByRole("button", { name: en.daily.submitAnswer }));

    expect(onSubmit).toHaveBeenCalledWith({
      kind: "ordered_list",
      value: ["t1", "t2", "t3"],
    });
  });

  it("no deja enviar una frase incompleta", async () => {
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);

    await build(["The cat"]);
    expect(screen.getByRole("button", { name: en.daily.submitAnswer })).toBeDisabled();
  });

  it("avisa cuando todos los fragmentos están colocados", async () => {
    render(<WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />);

    await build(["The cat", "was sleeping", "on the sofa."]);
    expect(screen.getByText(/All fragments are in your sentence/iu)).toBeInTheDocument();
  });

  it("anuncia la frase construida a los lectores de pantalla", async () => {
    const { container } = render(
      <WordOrderRenderer activity={activity} dictionary={en} onSubmit={vi.fn()} />,
    );

    await build(["The cat", "was sleeping"]);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "The cat was sleeping",
    );
  });
});
