import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { SwipeDeckRenderer } from "./SwipeDeckRenderer";
import type { SwipeDeckActivityDto } from "@/core/models";

function activity(cardCount = 5): SwipeDeckActivityDto {
  return {
    id: "deck",
    level: "B1",
    taxonomyNodeId: "topic",
    type: "swipe_deck",
    skillFocus: "swipe_deck",
    presentation: "swipe_deck",
    instructions: "Swipe right if the sentence is correct.",
    cards: Array.from({ length: cardCount }, (_, index) => ({
      id: `c${index + 1}`,
      statement: `Statement ${index + 1}`,
    })),
  };
}

describe("SwipeDeckRenderer", () => {
  it("muestra el progreso del mazo completo, no una sola carta", () => {
    render(<SwipeDeckRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });

  it("la carta es opaca: no comparte fondo con el contenedor", () => {
    render(<SwipeDeckRenderer activity={activity()} dictionary={en} onSubmit={vi.fn()} />);

    const card = screen.getByRole("group", { name: "Statement 1" });
    expect(card.className).toContain("ink-card--deck");
    expect(card.className).not.toContain("bg-surface ");
  });

  it("avanza de carta y envía todo el mazo al terminar", async () => {
    const onSubmit = vi.fn();
    render(
      <SwipeDeckRenderer activity={activity(2)} dictionary={en} onSubmit={onSubmit} />,
    );

    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    await waitFor(() => expect(screen.getByText("2 / 2")).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: en.activities.falseLabel }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        kind: "deck",
        value: [
          { cardId: "c1", value: true },
          { cardId: "c2", value: false },
        ],
      }),
    );
  });

  // Regresión: la carta de arriba era el mismo nodo para toda la partida, así
  // que al soltar volvía al centro y solo le cambiaba el texto. Con clave
  // propia la que se va se desmonta y sube la de debajo.
  it("la carta que se responde se desmonta en vez de reciclarse", async () => {
    render(
      <SwipeDeckRenderer activity={activity(3)} dictionary={en} onSubmit={vi.fn()} />,
    );

    const first = screen.getByRole("group", { name: "Statement 1" });
    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));

    const second = await screen.findByRole("group", { name: "Statement 2" });
    expect(second).not.toBe(first);
    expect(first.isConnected).toBe(false);
  });

  it("la carta de debajo se lee mientras la de arriba sale", () => {
    render(
      <SwipeDeckRenderer activity={activity(3)} dictionary={en} onSubmit={vi.fn()} />,
    );

    // El enunciado siguiente ya está en el DOM, detrás del actual.
    expect(screen.getByText("Statement 2")).toBeInTheDocument();
  });

  it("no responde dos veces con una doble pulsación", async () => {
    const onSubmit = vi.fn();
    render(
      <SwipeDeckRenderer activity={activity(3)} dictionary={en} onSubmit={onSubmit} />,
    );

    const trueButton = screen.getByRole("button", { name: en.activities.trueLabel });
    await userEvent.click(trueButton);
    await userEvent.click(trueButton);

    // La segunda pulsación cae dentro de la animación de salida y se ignora.
    await waitFor(() => expect(screen.getByText("2 / 3")).toBeInTheDocument());
  });

  // Regresión: al acabar volvía a salir la última carta, y se podía arrastrar
  // aunque la actividad ya estuviera enviada.
  it("cierra el mazo con una carta final que no se puede arrastrar", async () => {
    render(
      <SwipeDeckRenderer activity={activity(2)} dictionary={en} onSubmit={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    await screen.findByRole("group", { name: "Statement 2" });
    await userEvent.click(screen.getByRole("button", { name: en.activities.falseLabel }));

    await waitFor(() =>
      expect(screen.getByText(en.activities.deckFinishedTitle)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("group", { name: "Statement 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.activities.trueLabel })).toBeDisabled();
    expect(screen.getByRole("button", { name: en.activities.falseLabel })).toBeDisabled();
  });

  // Regresión: a la carta del fondo le faltaban la cabecera y la barra de
  // progreso, así que al subir a primer plano aparecían de golpe.
  it("la carta del fondo lleva la misma cara que la de arriba", () => {
    render(
      <SwipeDeckRenderer activity={activity(3)} dictionary={en} onSubmit={vi.fn()} />,
    );

    // Dos cabeceras visibles: la de la carta activa y la de la que viene.
    expect(screen.getAllByText(en.activities.swipeLeftHint).length).toBeGreaterThan(1);
    expect(screen.getAllByText(en.activities.swipeRightHint).length).toBeGreaterThan(1);
  });

  // El borde y la sombra de tinta entran con transición: la carta se monta de
  // cero al subir de posición, así que sin este paso aparecerían de golpe.
  it("la carta activa entra con el borde atenuado y lo asienta con transición", () => {
    render(
      <SwipeDeckRenderer activity={activity(3)} dictionary={en} onSubmit={vi.fn()} />,
    );

    const card = screen.getByRole("group", { name: "Statement 1" });
    expect(card.className).toContain("transition-[transform,border-color,box-shadow]");
    expect(card.style.boxShadow).toBe("0 0 0 transparent");
  });

  it("no responde cuando la actividad está bloqueada", async () => {
    const onSubmit = vi.fn();
    render(
      <SwipeDeckRenderer
        activity={activity(2)}
        dictionary={en}
        onSubmit={onSubmit}
        disabled
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: en.activities.trueLabel }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
