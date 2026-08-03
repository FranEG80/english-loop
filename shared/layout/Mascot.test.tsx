import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Mascot } from "./Mascot";

describe("Mascot", () => {
  it("is decorative and applies the requested dimensions", () => {
    const { container } = render(<Mascot pose="reading" size={96} />);
    const decorative = container.querySelector("[aria-hidden='true']");
    expect(decorative).not.toBeNull();
    expect(decorative).toHaveAttribute("aria-hidden", "true");
    expect(decorative).toHaveStyle({ width: "96px", height: "96px" });
  });
});
