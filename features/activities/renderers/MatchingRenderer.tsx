"use client";

import { useState } from "react";
import type { ActivityResponseValue, MatchingActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export function MatchingRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: MatchingActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const [pairs, setPairs] = useState<Array<{ leftId: string; rightId: string }>>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const pairedLeftIds = new Set(pairs.map((pair) => pair.leftId));
  const pairedRightIds = new Set(pairs.map((pair) => pair.rightId));

  function selectLeft(id: string) {
    if (disabled || pairedLeftIds.has(id)) return;
    setSelectedLeft(id);
  }

  function selectRight(id: string) {
    if (disabled || pairedRightIds.has(id) || !selectedLeft) return;
    setPairs((prev) => [...prev, { leftId: selectedLeft, rightId: id }]);
    setSelectedLeft(null);
  }

  function reset() {
    if (disabled) return;
    setPairs([]);
    setSelectedLeft(null);
  }

  function submit() {
    if (disabled || pairs.length !== activity.leftItems.length) return;
    onSubmit({ kind: "pairs", value: pairs });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="font-hand text-2xl font-bold text-coral">{dictionary.activities.matchPairsHint}</p>
      <div className="relative grid grid-cols-2 gap-4 sm:gap-8">
        <div className="flex flex-col gap-2">
          {activity.leftItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled || pairedLeftIds.has(item.id)}
              onClick={() => selectLeft(item.id)}
              aria-pressed={selectedLeft === item.id}
              className={cn(
                "min-h-16 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-[transform,background-color,box-shadow]",
                pairedLeftIds.has(item.id)
                  ? "translate-x-1 border-success bg-success-surface text-success"
                  : selectedLeft === item.id
                    ? "translate-x-2 border-foreground bg-accent text-foreground shadow-[3px_4px_0_var(--color-foreground)]"
                    : "border-foreground/35 bg-white hover:translate-x-1 hover:border-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {activity.rightItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled || pairedRightIds.has(item.id)}
              onClick={() => selectRight(item.id)}
              className={cn(
                "min-h-16 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-[transform,background-color]",
                pairedRightIds.has(item.id)
                  ? "border-success bg-success-surface text-success"
                  : "border-foreground/35 bg-white hover:-translate-x-1 hover:border-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset} disabled={disabled}>
          {dictionary.activities.resetSelection}
        </Button>
        <Button
          onClick={submit}
          disabled={disabled || pairs.length !== activity.leftItems.length}
          size="lg"
        >
          {dictionary.daily.submitAnswer}
        </Button>
      </div>
    </div>
  );
}
