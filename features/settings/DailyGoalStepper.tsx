"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function DailyGoalStepper({
  defaultValue,
  label,
}: {
  defaultValue: number;
  label: string;
}) {
  const [value, setValue] = useState(defaultValue);

  function update(next: number) {
    setValue(Math.min(20, Math.max(1, next)));
  }

  return (
    <div>
      <input type="hidden" name="dailyGoal" value={value} />
      <div
        role="group"
        aria-label={label}
        className="inline-grid grid-cols-[3.25rem_5.5rem_3.25rem] items-center overflow-hidden rounded-2xl border-2 border-foreground bg-surface shadow-[4px_5px_0_var(--color-foreground)]"
      >
        <button
          type="button"
          onClick={() => update(value - 1)}
          disabled={value <= 1}
          aria-label={`${label}: -1`}
          className="grid h-16 place-items-center border-r-2 border-foreground bg-level-b1 text-primary-dark transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="grid h-16 place-items-center font-serif text-4xl font-black"
        >
          {value}
        </output>
        <button
          type="button"
          onClick={() => update(value + 1)}
          disabled={value >= 20}
          aria-label={`${label}: +1`}
          className="grid h-16 place-items-center border-l-2 border-foreground bg-level-b1 text-primary-dark transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
