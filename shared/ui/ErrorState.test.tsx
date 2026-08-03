import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("exposes an alert with recovery action", () => {
    render(<ErrorState title="Ha ocurrido un error" description="Reintenta" action={<button>Reintentar</button>} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Ha ocurrido un error");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
