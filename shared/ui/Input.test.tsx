import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("connects label, hint and error state accessibly", () => {
    const { rerender } = render(<Input id="email" label="Correo" hint="No compartiremos tu correo" />);
    const input = screen.getByRole("textbox", { name: "Correo" });
    expect(input).toHaveAttribute("aria-describedby", "email-hint");
    expect(input).toHaveAttribute("aria-invalid", "false");
    rerender(<Input id="email" label="Correo" error="Correo inválido" />);
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Correo inválido")).toBeInTheDocument();
  });
});
