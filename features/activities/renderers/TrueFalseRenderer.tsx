"use client";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Check, MoveHorizontal, X } from "lucide-react";
import type {
  ActivityResponseValue,
  TrueFalseActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

const SWIPE_THRESHOLD = 72;

export function TrueFalseRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: TrueFalseActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const cards =
    activity.statements ?? [{ id: activity.id, statement: activity.statement }];
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [exitDirection, setExitDirection] = useState<-1 | 0 | 1>(0);
  const card = cards[index];

  function answer(value: boolean) {
    if (disabled || exitDirection !== 0) return;
    const next = [...answers, value];
    setExitDirection(value ? 1 : -1);
    window.setTimeout(() => {
      if (index === cards.length - 1) {
        onSubmit(
          cards.length === 1
            ? { kind: "boolean", value }
            : { kind: "boolean_list", value: next },
        );
      } else {
        setAnswers(next);
        setIndex((current) => current + 1);
        setExitDirection(0);
        setDragX(0);
      }
    }, 220);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    startX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (startX.current === null || disabled) return;
    setDragX(event.clientX - startX.current);
  }

  function handlePointerUp() {
    if (startX.current === null || disabled) return;
    if (dragX > SWIPE_THRESHOLD) answer(true);
    else if (dragX < -SWIPE_THRESHOLD) answer(false);
    else setDragX(0);
    startX.current = null;
  }

  const transform =
    exitDirection !== 0
      ? `translateX(${exitDirection * 140}%) rotate(${exitDirection * 16}deg)`
      : `translateX(${dragX}px) rotate(${dragX / 24}deg)`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-lg items-center justify-between">
        <p className="font-hand text-2xl font-bold text-primary">
          Swipe deck
        </p>
        <p className="rounded-full bg-surface-muted px-3 py-1 text-sm font-black">
          {index + 1} / {cards.length}
        </p>
      </div>
      <div className="relative h-[19rem] w-full max-w-lg">
        {cards.slice(index + 1, index + 3).reverse().map((nextCard, stackIndex) => (
          <div
            key={nextCard.id}
            aria-hidden="true"
            className="absolute inset-x-4 top-3 h-[17rem] rounded-[2rem] border-2 border-foreground/50 bg-level-b1"
            style={{
              transform: `translateY(${(stackIndex + 1) * 10}px) scale(${1 - (stackIndex + 1) * 0.035})`,
            }}
          />
        ))}
        <div
          key={card.id}
          role="group"
          aria-label={`${index + 1} / ${cards.length}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ transform }}
          className="ink-card absolute inset-0 flex cursor-grab touch-pan-y select-none flex-col justify-between rounded-[2rem] bg-surface p-7 transition-transform duration-200 active:cursor-grabbing sm:p-9"
        >
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[.14em] text-foreground/50">
            <span>False ←</span>
            <MoveHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>→ True</span>
          </div>
          <p className="text-center font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            “{card.statement}”
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${((index + 1) / cards.length) * 100}%` }}
            />
          </div>
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-6 top-20 -rotate-12 rounded-xl border-4 px-3 py-1 text-3xl font-black uppercase opacity-0",
              dragX < -25 && "border-danger text-danger opacity-100",
            )}
          >
            False
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-6 top-20 rotate-12 rounded-xl border-4 px-3 py-1 text-3xl font-black uppercase opacity-0",
              dragX > 25 && "border-success text-success opacity-100",
            )}
          >
            True
          </span>
        </div>
      </div>
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => answer(false)}
          disabled={disabled}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-danger bg-danger-surface font-black text-danger transition-transform hover:-translate-y-1 disabled:opacity-50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          {dictionary.activities.falseLabel}
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          disabled={disabled}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-success bg-success-surface font-black text-success transition-transform hover:-translate-y-1 disabled:opacity-50"
        >
          <Check className="h-5 w-5" aria-hidden="true" />
          {dictionary.activities.trueLabel}
        </button>
      </div>
      <p className="text-center text-sm font-semibold text-foreground/55">
        {dictionary.activities.trueLabel}: swipe right ·{" "}
        {dictionary.activities.falseLabel}: swipe left
      </p>
    </div>
  );
}
