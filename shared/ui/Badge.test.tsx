import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label, optional icon and tone classes", () => {
    render(<Badge tone="success" icon={<span aria-hidden="true">✓</span>}>Correcto</Badge>);
    const badge = screen.getByText("Correcto");
    expect(badge).toHaveClass("bg-success-surface");
    expect(screen.getByText("✓")).toBeInTheDocument();
  });
});
