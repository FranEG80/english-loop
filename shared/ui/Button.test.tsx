import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children as an accessible button, defaulting to type=button", () => {
    render(<Button>Continuar</Button>);
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("dispatches user interaction and respects disabled state", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).toHaveBeenCalledOnce();

    render(<Button disabled onClick={onClick}>Bloqueado</Button>);
    await user.click(screen.getByRole("button", { name: "Bloqueado" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
