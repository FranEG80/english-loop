"use client";

import { useState } from "react";
import type {
  ActivityResponseValue,
  MultipleChoiceActivityDto,
  SingleChoiceActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

type ChoiceActivity = SingleChoiceActivityDto | MultipleChoiceActivityDto;

export function ChoiceRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: ChoiceActivity;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const isMultiple = activity.type === "multiple_choice";
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    if (disabled) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
      );
    } else {
      setSelected([id]);
    }
  }

  function submit() {
    if (disabled || selected.length === 0) return;
    onSubmit(
      isMultiple
        ? { kind: "multiple", value: selected }
        : { kind: "single", value: selected[0] },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="font-serif text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        {activity.question}
      </p>
      <p className="font-hand text-2xl font-bold text-coral">
        {isMultiple ? dictionary.activities.selectMultiple : dictionary.activities.selectOne}
      </p>
      <div role="group" aria-label={activity.question} className="grid gap-3 sm:grid-cols-2">
        {activity.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const index = activity.options.indexOf(option);
          return (
            <button
              key={option.id}
              type="button"
              role={isMultiple ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => toggle(option.id)}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition-[transform,background-color,box-shadow]",
                isSelected
                  ? "translate-x-1 -translate-y-1 border-foreground bg-accent text-foreground shadow-[3px_4px_0_var(--color-foreground)]"
                  : "border-foreground/35 bg-white hover:-translate-y-0.5 hover:border-foreground",
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-current font-black">
                {String.fromCharCode(65 + index)}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
      <Button onClick={submit} disabled={disabled || selected.length === 0} size="lg">
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}
