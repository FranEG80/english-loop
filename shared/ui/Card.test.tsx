import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("preserves semantic content and merges custom classes", () => {
    render(<Card className="custom">Contenido</Card>);
    expect(screen.getByText("Contenido")).toHaveClass("editorial-card", "custom");
  });
});
