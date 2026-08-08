"use client";

import { useRef, useState } from "react";
import type { ActivityResponseValue, ChoiceActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { withVisibleGaps } from "../gap-display";

export interface ChoiceRendererProps {
  activity: ChoiceActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

/**
 * Opción única o múltiple. En selección única el grupo es un `radiogroup` con
 * tabulación itinerante: se entra una vez con el tabulador y se recorre con
 * las flechas, que es lo que espera un lector de pantalla.
 */
export function ChoiceRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: ChoiceRendererProps) {
  const isMultiple = activity.selection === "multiple";
  const [selected, setSelected] = useState<string[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function toggle(id: string) {
    if (disabled) return;
    setSelected((current) =>
      isMultiple
        ? current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id]
        : [id],
    );
  }

  function submit() {
    if (disabled || selected.length === 0) return;
    onSubmit(
      isMultiple
        ? { kind: "multiple", value: selected }
        : { kind: "single", value: selected[0]! },
    );
  }

  function moveFocus(delta: number) {
    const next = (focusIndex + delta + activity.options.length) % activity.options.length;
    setFocusIndex(next);
    buttons.current[next]?.focus();
    if (!isMultiple) toggle(activity.options[next]!.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {withVisibleGaps(activity.context)}
        </blockquote>
      ) : null}

      <p className="font-serif text-2xl leading-relaxed">
        {withVisibleGaps(activity.question)}
      </p>
      <p className="text-sm text-foreground/60">
        {isMultiple ? dictionary.activities.selectMultiple : dictionary.activities.selectOne}
      </p>

      <div
        role={isMultiple ? "group" : "radiogroup"}
        aria-label={activity.question}
        className="grid gap-3 sm:grid-cols-2"
        onKeyDown={(event) => {
          if (isMultiple) return;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            moveFocus(1);
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            moveFocus(-1);
          }
        }}
      >
        {activity.options.map((option, index) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role={isMultiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              tabIndex={isMultiple || index === focusIndex ? 0 : -1}
              disabled={disabled}
              onClick={() => {
                setFocusIndex(index);
                toggle(option.id);
              }}
              className={cn(
                "flex items-center gap-3 rounded-control border-2 px-4 py-3 text-left text-lg font-bold transition-transform disabled:opacity-50",
                isSelected
                  ? "-translate-y-1 translate-x-1 border-foreground bg-accent shadow-[3px_4px_0_var(--color-foreground)]"
                  : "border-foreground/35 bg-surface hover:-translate-y-0.5",
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-surface text-sm font-black"
              >
                {optionLetter(index)}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        size="lg"
        onClick={submit}
        disabled={disabled || selected.length === 0}
      >
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}

/** A, B, C… y a partir de la 27.ª opción se numeran, para no salirse del alfabeto. */
function optionLetter(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}
