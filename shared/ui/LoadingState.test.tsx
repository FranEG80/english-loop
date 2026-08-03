import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("uses a polite status region and custom label", () => {
    render(<LoadingState label="Cargando lecciones" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando lecciones");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
