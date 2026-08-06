import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getMasonryRowSpan,
  LessonSectionMasonry,
} from "./LessonSectionMasonry";

describe("getMasonryRowSpan", () => {
  it("translates the measured card height into compact grid rows", () => {
    expect(getMasonryRowSpan(396, 1, 20)).toBe(20);
    expect(getMasonryRowSpan(417, 1, 20)).toBe(21);
  });

  it("always reserves at least one row", () => {
    expect(getMasonryRowSpan(0, 1, 20)).toBe(1);
  });

  it("measures every card and enables masonry at desktop widths", () => {
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      disconnect = disconnect;
    });
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: () => "1",
      rowGap: "20px",
    } as unknown as CSSStyleDeclaration);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        const height = Number(this.dataset.testHeight ?? 0);
        return { height } as DOMRect;
      },
    );

    const { container, unmount } = render(
      <LessonSectionMasonry>
        <section data-lesson-section-card data-lesson-section-placement="left">
          <div data-lesson-section-content data-test-height="392" />
        </section>
        <section data-lesson-section-card data-lesson-section-placement="right">
          <div data-lesson-section-content data-test-height="413" />
        </section>
      </LessonSectionMasonry>,
    );

    const grid = container.querySelector("[data-lesson-section-masonry]");
    const cards = container.querySelectorAll<HTMLElement>(
      "[data-lesson-section-card]",
    );
    expect(grid).toHaveAttribute("data-masonry-ready", "true");
    expect(cards[0]?.style.getPropertyValue("--lesson-section-row-start")).toBe("1");
    expect(cards[1]?.style.getPropertyValue("--lesson-section-row-start")).toBe("1");
    expect(cards[0]?.style.getPropertyValue("--lesson-section-rows")).toBe("20");
    expect(cards[1]?.style.getPropertyValue("--lesson-section-rows")).toBe("21");

    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
