"use client";

import { Check, MoveHorizontal, X } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ActivityResponseValue, SwipeDeckActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

export interface SwipeDeckRendererProps {
  activity: SwipeDeckActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 72;
const EXIT_MS = 220;

/**
 * Mazo de 5 a 10 afirmaciones verdadero/falso. Se responde deslizando o con
 * los dos botones, y al terminar se envía el mazo completo en un único
 * intento: la media de aciertos y la lista de fallos se calculan en el
 * servidor, igual que en el resto de tipos.
 */
export function SwipeDeckRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: SwipeDeckRendererProps) {
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<Array<{ cardId: string; value: boolean }>>([]);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const answering = useRef(false);
  const pointerStart = useRef<number | null>(null);

  const cards = activity.cards;
  const card = cards[index];

  function answer(value: boolean) {
    if (disabled || answering.current || !card) return;
    answering.current = true;
    setExitDirection(value ? "right" : "left");

    const next = [...given, { cardId: card.id, value }];
    setTimeout(() => {
      setDragX(0);
      setDragging(false);
      setExitDirection(null);
      answering.current = false;
      setGiven(next);
      if (next.length === cards.length) onSubmit({ kind: "deck", value: next });
      else setIndex((current) => current + 1);
    }, EXIT_MS);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || answering.current) return;
    pointerStart.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    setDragX(event.clientX - pointerStart.current);
  }

  function onPointerUp() {
    if (pointerStart.current === null) return;
    const travelled = dragX;
    pointerStart.current = null;
    setDragging(false);
    if (Math.abs(travelled) >= SWIPE_THRESHOLD) answer(travelled > 0);
    else setDragX(0);
  }

  if (!card) return null;

  const transform = exitDirection
    ? `translateX(${exitDirection === "right" ? 140 : -140}%) rotate(${exitDirection === "right" ? 16 : -16}deg)`
    : `translateX(${dragX}px) rotate(${dragX / 24}deg)`;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="w-full text-sm font-semibold text-foreground/70">
        {activity.instructions}
      </p>

      <div className="flex w-full max-w-lg items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">
          {dictionary.activities.swipeDeckTitle}
        </p>
        <span className="rounded-control bg-surface-muted px-3 py-1 text-sm font-bold">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="relative h-[19rem] w-full max-w-lg">
        {/* Cartas de fondo: dan profundidad y confirman que quedan más. */}
        {cards.slice(index + 1, index + 3).reverse().map((backing, offset) => {
          const depth = cards.slice(index + 1, index + 3).length - offset;
          return (
            <div
              key={backing.id}
              aria-hidden="true"
              className="ink-card absolute inset-0 rounded-[2rem] bg-level-b1"
              style={{
                transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.035})`,
              }}
            />
          );
        })}

        <div
          role="group"
          aria-label={card.statement}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ transform }}
          className={cn(
            "ink-card ink-card--deck absolute inset-0 flex cursor-grab touch-pan-y select-none flex-col justify-between rounded-[2rem] p-7 active:cursor-grabbing sm:p-9",
            // Sin transición mientras se arrastra: si no, la carta va 200 ms
            // por detrás del dedo.
            isDragging ? "" : "transition-transform duration-200",
          )}
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[.16em] text-foreground/45">
            <span>{dictionary.activities.swipeLeftHint}</span>
            <MoveHorizontal className="size-5" aria-hidden="true" />
            <span>{dictionary.activities.swipeRightHint}</span>
          </div>

          <p className="font-serif text-3xl leading-snug">{card.statement}</p>

          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${((index + 1) / cards.length) * 100}%` }}
            />
          </div>

          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-6 top-24 -rotate-12 rounded-control border-4 border-success px-4 py-1 text-2xl font-black uppercase text-success transition-opacity",
              dragX > SWIPE_THRESHOLD / 2 ? "opacity-100" : "opacity-0",
            )}
          >
            {dictionary.activities.trueLabel}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute right-6 top-24 rotate-12 rounded-control border-4 border-danger px-4 py-1 text-2xl font-black uppercase text-danger transition-opacity",
              dragX < -SWIPE_THRESHOLD / 2 ? "opacity-100" : "opacity-0",
            )}
          >
            {dictionary.activities.falseLabel}
          </span>
        </div>
      </div>

      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => answer(false)}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-danger-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <X className="size-5" aria-hidden="true" />
          {dictionary.activities.falseLabel}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => answer(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-success-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Check className="size-5" aria-hidden="true" />
          {dictionary.activities.trueLabel}
        </button>
      </div>

      <p className="text-sm text-foreground/60">{dictionary.activities.swipeHint}</p>
    </div>
  );
}
