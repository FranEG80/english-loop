import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { CanvasSentenceMap } from "./CanvasSentenceMap";

vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, configurable: true });

describe("CanvasSentenceMap", () => {
  it("lets the learner toggle sentence nodes", async () => {
    const user = userEvent.setup();
    render(<CanvasSentenceMap dictionary={en} locale="en" preview={{ title: { en: "Build", es: "Construye" }, description: { en: "Description", es: "Descripción" } } as never} />);
    const subject = screen.getByRole("button", { name: /The student/ });
    await user.click(subject);
    expect(subject).toHaveAttribute("aria-pressed", "true");
    await user.click(subject);
    expect(subject).toHaveAttribute("aria-pressed", "false");
  });
});
