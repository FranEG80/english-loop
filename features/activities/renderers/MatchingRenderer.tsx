"use client";

import { useState } from "react";
import type {
  ActivityResponseValue,
  AttemptFeedbackDto,
  MatchingActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export interface MatchingRendererProps {
  activity: MatchingActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
  /** Corrección del servidor: pinta cada pareja de verde o de rojo. */
  feedback?: AttemptFeedbackDto | null;
}

/**
 * Emparejado por selección: se pulsa un elemento de la izquierda y luego su
 * pareja en la derecha. Un par ya formado se puede deshacer pulsándolo, sin
 * tener que reiniciar la actividad entera.
 */
export function MatchingRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
  feedback,
}: MatchingRendererProps) {
  const [pairs, setPairs] = useState<Array<{ leftId: string; rightId: string }>>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  // Antes de corregir, una pareja formada es «pendiente», no «acertada»: se
  // pinta en lila, no en verde. El verde y el rojo llegan con la corrección.
  const verdictByLeft = new Map(
    (feedback?.items ?? []).map((item) => [item.itemId, item.isCorrect] as const),
  );
  const isGraded = verdictByLeft.size > 0;

  const rightByLeft = new Map(pairs.map((pair) => [pair.leftId, pair.rightId]));
  const leftByRight = new Map(pairs.map((pair) => [pair.rightId, pair.leftId]));
  const isComplete = pairs.length === activity.leftItems.length;

  function selectLeft(id: string) {
    if (disabled) return;
    // Pulsar un elemento ya emparejado deshace su par.
    if (rightByLeft.has(id)) {
      setPairs((current) => current.filter((pair) => pair.leftId !== id));
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft((current) => (current === id ? null : id));
  }

  function selectRight(id: string) {
    if (disabled) return;
    if (leftByRight.has(id)) {
      setPairs((current) => current.filter((pair) => pair.rightId !== id));
      return;
    }
    if (!selectedLeft) return;
    setPairs((current) => [...current, { leftId: selectedLeft, rightId: id }]);
    setSelectedLeft(null);
  }

  function reset() {
    if (disabled) return;
    setPairs([]);
    setSelectedLeft(null);
  }

  function submit() {
    if (disabled || !isComplete) return;
    onSubmit({ kind: "pairs", value: pairs });
  }

  function labelFor(rightId: string): string | undefined {
    const leftId = leftByRight.get(rightId);
    return activity.leftItems.find((item) => item.id === leftId)?.label;
  }

  /** Estilo de una pareja según su estado: pendiente, acertada o fallada. */
  function pairTone(leftId: string | undefined): string {
    if (leftId === undefined) return "";
    const verdict = verdictByLeft.get(leftId);
    if (verdict === true) return "border-success bg-success-surface text-success";
    if (verdict === false) return "border-danger bg-danger-surface text-danger";
    return "border-primary bg-level-b2 text-foreground";
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {activity.context}
        </blockquote>
      ) : null}

      <p className="font-hand text-2xl font-bold text-coral">
        {dictionary.activities.matchPairsHint}
      </p>

      <div className="relative grid grid-cols-2 gap-4 sm:gap-8">
        <div className="flex flex-col gap-2">
          {activity.leftItems.map((item) => {
            const isPaired = rightByLeft.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => selectLeft(item.id)}
                aria-pressed={isPaired || selectedLeft === item.id}
                className={cn(
                  "min-h-16 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-[transform,background-color,box-shadow] disabled:opacity-50",
                  isPaired
                    ? `translate-x-1 ${pairTone(item.id)}`
                    : selectedLeft === item.id
                      ? "translate-x-2 border-foreground bg-accent text-foreground shadow-[3px_4px_0_var(--color-foreground)]"
                      : "border-foreground/35 bg-white hover:translate-x-1 hover:border-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {activity.rightItems.map((item) => {
            const pairedWith = labelFor(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => selectRight(item.id)}
                aria-pressed={pairedWith !== undefined}
                aria-label={
                  pairedWith
                    ? dictionary.activities.pairedWith
                        .replace("{right}", item.label)
                        .replace("{left}", pairedWith)
                    : item.label
                }
                className={cn(
                  "min-h-16 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-[transform,background-color] disabled:opacity-50",
                  pairedWith !== undefined
                    ? pairTone(leftByRight.get(item.id))
                    : "border-foreground/35 bg-white hover:-translate-x-1 hover:border-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {isGraded ? <MatchingReview activity={activity} feedback={feedback!} /> : null}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset} disabled={disabled || pairs.length === 0}>
          {dictionary.activities.resetSelection}
        </Button>
        <Button onClick={submit} disabled={disabled || !isComplete} size="lg">
          {dictionary.daily.submitAnswer}
        </Button>
      </div>
    </div>
  );
}

/** Explicación de cada pareja fallada, debajo de las columnas. */
function MatchingReview({
  activity,
  feedback,
}: {
  activity: MatchingActivityDto;
  feedback: AttemptFeedbackDto;
}) {
  const wrong = feedback.items.filter((item) => !item.isCorrect);
  if (wrong.length === 0) return null;

  const leftLabel = (id: string) =>
    activity.leftItems.find((item) => item.id === id)?.label ?? id;

  return (
    <ul className="flex flex-col gap-2 rounded-control border-2 border-danger/40 bg-danger-surface/40 p-4">
      {wrong.map((item) => (
        <li key={item.itemId} className="text-sm">
          <span className="font-bold">{leftLabel(item.itemId)}</span>
          {" → "}
          <span className="line-through opacity-70">{item.given || "—"}</span>{" "}
          <span className="font-bold text-success">{item.expected.join(", ")}</span>
          {item.feedback ? <p className="mt-0.5 opacity-80">{item.feedback}</p> : null}
        </li>
      ))}
    </ul>
  );
}
