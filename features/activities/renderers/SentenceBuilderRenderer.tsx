"use client";

import { useState } from "react";
import type { ActivityResponseValue, SentenceTransformationActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";

interface WordChip {
  id: string;
  word: string;
}

export function SentenceBuilderRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: SentenceTransformationActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const initialBank: WordChip[] = activity.wordBank.map((word, index) => ({
    id: `${word}-${index}`,
    word,
  }));
  const [available, setAvailable] = useState<WordChip[]>(initialBank);
  const [built, setBuilt] = useState<WordChip[]>([]);

  function addWord(item: WordChip) {
    if (disabled) return;
    setAvailable((prev) => prev.filter((word) => word.id !== item.id));
    setBuilt((prev) => [...prev, item]);
  }

  function removeWord(item: WordChip) {
    if (disabled) return;
    setBuilt((prev) => prev.filter((word) => word.id !== item.id));
    setAvailable((prev) => [...prev, item]);
  }

  function reset() {
    if (disabled) return;
    setAvailable(initialBank);
    setBuilt([]);
  }

  function submit() {
    if (disabled || built.length === 0) return;
    onSubmit({ kind: "ordered_list", value: built.map((item) => item.word) });
  }

  return (
    <div className="flex flex-col gap-5">
      <blockquote className="rounded-2xl border-l-4 border-coral bg-danger-surface/60 p-4 font-serif text-2xl font-semibold">
        “{activity.originalSentence}”
      </blockquote>
      <p className="font-hand text-2xl font-bold text-coral">{activity.instructionHint}</p>
      <p className="text-sm font-bold text-foreground/70">
        {dictionary.activities.buildSentenceHint}
      </p>
      <div className="flex min-h-24 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-level-b1/45 p-4">
        {built.length === 0 ? (
          <span className="text-sm text-foreground/50">{dictionary.activities.wordBankHint}</span>
        ) : null}
        {built.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => removeWord(item)}
            aria-label={`${dictionary.activities.removeWord}: ${item.word}`}
            className="rounded-xl border-2 border-foreground bg-primary-dark px-3 py-2 text-sm font-bold text-white shadow-[2px_3px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5"
          >
            {item.word}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-surface-muted p-4">
        {available.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => addWord(item)}
            className="rounded-xl border-2 border-foreground/45 bg-white px-3 py-2 text-sm font-bold text-foreground transition-transform hover:-translate-y-1 hover:border-foreground"
          >
            {item.word}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset} disabled={disabled}>
          {dictionary.activities.resetSelection}
        </Button>
        <Button onClick={submit} disabled={disabled || built.length === 0} size="lg">
          {dictionary.daily.submitAnswer}
        </Button>
      </div>
    </div>
  );
}
