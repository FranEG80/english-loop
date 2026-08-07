"use client";

import { Check, X } from "lucide-react";
import type { ActivityResponseValue, TrueFalseActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";

export interface TrueFalseRendererProps {
  activity: TrueFalseActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

/**
 * Una sola afirmación con dos botones. El mazo deslizable es otra actividad
 * distinta (`swipe_deck`) con su propio contenido, no un modo de esta.
 */
export function TrueFalseRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: TrueFalseRendererProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {activity.context}
        </blockquote>
      ) : null}

      <p className="font-serif text-3xl leading-snug">{activity.statement}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit({ kind: "boolean", value: false })}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-danger-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <X className="size-5" aria-hidden="true" />
          {dictionary.activities.falseLabel}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit({ kind: "boolean", value: true })}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-success-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Check className="size-5" aria-hidden="true" />
          {dictionary.activities.trueLabel}
        </button>
      </div>
    </div>
  );
}
