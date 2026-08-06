"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DESKTOP_LAYOUT = "(min-width: 64rem)";
const CARD_SELECTOR = "[data-lesson-section-card]";
const CONTENT_SELECTOR = "[data-lesson-section-content]";

export function getMasonryRowSpan(
  height: number,
  rowHeight: number,
  rowGap: number,
): number {
  return Math.max(1, Math.ceil((height + rowGap) / (rowHeight + rowGap)));
}

export function LessonSectionMasonry({ children }: { children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetGrid = gridRef.current;
    if (targetGrid === null) return;
    if (typeof ResizeObserver === "undefined") return;
    const gridElement: HTMLDivElement = targetGrid;

    const mediaQuery = window.matchMedia(DESKTOP_LAYOUT);
    const cards = Array.from(
      gridElement.querySelectorAll<HTMLElement>(CARD_SELECTOR),
    );
    let frame: number | undefined;

    function applyLayout() {
      frame = undefined;
      if (!mediaQuery.matches) {
        gridElement.removeAttribute("data-masonry-ready");
        for (const card of cards) {
          card.style.removeProperty("--lesson-section-row-start");
          card.style.removeProperty("--lesson-section-rows");
        }
        return;
      }

      const gridStyle = window.getComputedStyle(gridElement);
      const rowHeight = Number.parseFloat(
        gridStyle.getPropertyValue("--lesson-masonry-row-height"),
      ) || 1;
      const rowGap = Number.parseFloat(gridStyle.rowGap) || 0;
      const heights = cards.map((card) => {
        const content = card.querySelector<HTMLElement>(CONTENT_SELECTOR);
        return (content?.getBoundingClientRect().height ?? 0) + 4;
      });
      const spans = heights.map((height) =>
        getMasonryRowSpan(height, rowHeight, rowGap),
      );
      let leftRow = 1;
      let rightRow = 1;

      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        if (!card) continue;
        const span = spans[index] ?? 1;
        const placement = card.dataset.lessonSectionPlacement ?? "full";
        let rowStart: number;
        if (placement === "left") {
          rowStart = leftRow;
          leftRow += span;
        } else if (placement === "right") {
          rowStart = rightRow;
          rightRow += span;
        } else {
          rowStart = Math.max(leftRow, rightRow);
          leftRow = rowStart + span;
          rightRow = rowStart + span;
        }

        card.style.setProperty("--lesson-section-row-start", String(rowStart));
        card.style.setProperty("--lesson-section-rows", String(span));
      }
      gridElement.setAttribute("data-masonry-ready", "true");
    }

    function scheduleLayout() {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyLayout);
    }

    const observer = new ResizeObserver(scheduleLayout);
    for (const card of cards) {
      const content = card.querySelector<HTMLElement>(CONTENT_SELECTOR);
      if (content) observer.observe(content);
    }
    mediaQuery.addEventListener("change", scheduleLayout);
    scheduleLayout();

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      observer.disconnect();
      mediaQuery.removeEventListener("change", scheduleLayout);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      data-lesson-section-masonry
      className="lesson-section-masonry grid gap-5"
    >
      {children}
    </div>
  );
}
