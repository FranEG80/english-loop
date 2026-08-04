import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { CanvasSentenceMap } from "./CanvasSentenceMap";

let resize: (() => void) | undefined;
vi.stubGlobal("ResizeObserver", class {
  constructor(callback: () => void) { resize = callback; }
  observe() {}
  disconnect() {}
});

const context = {
  scale: vi.fn(), clearRect: vi.fn(), createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  beginPath: vi.fn(), moveTo: vi.fn(), bezierCurveTo: vi.fn(), stroke: vi.fn(),
};
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

  it("draws connections when a canvas context is available and can reset them", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => context, configurable: true });
    const user = userEvent.setup();
    render(<CanvasSentenceMap dictionary={en} locale="en" preview={{ title: { en: "Build", es: "Construye" }, description: { en: "Description", es: "Descripción" } } as never} />);
    await user.click(screen.getByRole("button", { name: /The student/ }));
    await user.click(screen.getByRole("button", { name: /is building/ }));
    expect(context.createLinearGradient).toHaveBeenCalled();
    resize?.();
    await user.click(screen.getByRole("button", { name: /Reset/ }));
    expect(screen.getByRole("button", { name: /The student/ })).toHaveAttribute("aria-pressed", "false");
    expect(context.clearRect).toHaveBeenCalled();
  });
});
