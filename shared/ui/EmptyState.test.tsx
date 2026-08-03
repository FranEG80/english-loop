import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title, description and an action without requiring an illustration", () => {
    render(<EmptyState title="Sin resultados" description="Prueba otro filtro" action={<button>Limpiar</button>} />);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("Prueba otro filtro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });
});
