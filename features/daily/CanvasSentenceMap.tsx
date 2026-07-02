"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import type { CanvasPreviewDto, Locale } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

const NODES = [
  { id: "subject", label: "The student", x: 0.18, y: 0.34, color: "#f6bc45" },
  { id: "verb", label: "is building", x: 0.5, y: 0.68, color: "#ed6a4c" },
  { id: "object", label: "a sentence", x: 0.82, y: 0.34, color: "#9bd7d0" },
] as const;

export function CanvasSentenceMap({
  preview,
  locale,
  dictionary,
}: {
  preview: CanvasPreviewDto;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const targetCanvas = canvas;
    const targetContainer = container;

    function draw() {
      const rect = targetContainer.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      targetCanvas.width = rect.width * ratio;
      targetCanvas.height = rect.height * ratio;
      targetCanvas.style.width = `${rect.width}px`;
      targetCanvas.style.height = `${rect.height}px`;
      const context = targetCanvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, rect.width, rect.height);
      context.lineCap = "round";
      context.lineWidth = 7;

      for (let index = 1; index < active.length; index += 1) {
        const from = NODES.find((node) => node.id === active[index - 1]);
        const to = NODES.find((node) => node.id === active[index]);
        if (!from || !to) continue;
        const gradient = context.createLinearGradient(
          from.x * rect.width,
          from.y * rect.height,
          to.x * rect.width,
          to.y * rect.height,
        );
        gradient.addColorStop(0, from.color);
        gradient.addColorStop(1, to.color);
        context.strokeStyle = gradient;
        context.beginPath();
        context.moveTo(from.x * rect.width, from.y * rect.height);
        context.bezierCurveTo(
          from.x * rect.width,
          rect.height * 0.84,
          to.x * rect.width,
          rect.height * 0.84,
          to.x * rect.width,
          to.y * rect.height,
        );
        context.stroke();
      }
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(targetContainer);
    return () => observer.disconnect();
  }, [active]);

  function toggle(id: string) {
    setActive((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-foreground bg-primary-dark text-white shadow-[6px_8px_0_var(--color-foreground)]">
      <div className="flex flex-col gap-2 border-b border-white/15 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.17em] text-accent">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {dictionary.daily.canvasBadge} · interactive canvas
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{preview.title[locale]}</h2>
        </div>
        <button
          type="button"
          onClick={() => setActive([])}
          className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-white/35 px-4 text-sm font-bold hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>
      <p className="px-6 pt-5 font-semibold text-white/65">
        {preview.description[locale]}
      </p>
      <div ref={containerRef} className="relative mt-4 h-[22rem] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
        {NODES.map((node, index) => (
          <button
            key={node.id}
            type="button"
            onClick={() => toggle(node.id)}
            aria-pressed={active.includes(node.id)}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 px-4 py-3 text-sm font-black text-foreground shadow-[3px_4px_0_var(--color-foreground)] transition-transform hover:-translate-y-[58%]",
              active.includes(node.id) ? "scale-105 border-white" : "border-foreground",
            )}
            style={{
              left: `${node.x * 100}%`,
              top: `${node.y * 100}%`,
              backgroundColor: node.color,
            }}
          >
            <span className="mb-1 block text-[0.65rem] uppercase tracking-widest opacity-55">
              {index === 0 ? "subject" : index === 1 ? "verb" : "object"}
            </span>
            {node.label}
          </button>
        ))}
        <p className="font-hand absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-2xl font-bold text-accent">
          Tap the words to map the sentence
        </p>
      </div>
    </section>
  );
}
