import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children as an accessible button, defaulting to type=button", () => {
    render(<Button>Continuar</Button>);
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });
});
