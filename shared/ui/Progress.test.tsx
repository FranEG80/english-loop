import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("clamps values and exposes progress semantics", () => {
    const { rerender } = render(<Progress value={150} label="Avance" />);
    const progress = screen.getByRole("progressbar", { name: "Avance" });
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    rerender(<Progress value={-10} label="Avance" />);
    expect(progress).toHaveAttribute("aria-valuenow", "0");
  });
});
