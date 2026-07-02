"use client";

import { useState } from "react";
import type { FlashcardStackDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Card } from "@/shared/ui";

export function FlashcardReview({
  stack,
  dictionary,
}: {
  stack: FlashcardStackDto;
  dictionary: Dictionary;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = stack.cards[index];

  function next() {
    setRevealed(false);
    setIndex((prev) => (prev + 1) % stack.cards.length);
  }

  function prev() {
    setRevealed(false);
    setIndex((prev) => (prev - 1 + stack.cards.length) % stack.cards.length);
  }

  return (
    <Card className="flex flex-col gap-5 bg-accent/35 p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-foreground">
          {dictionary.daily.flashcardsTitle}
        </h2>
        <p className="text-sm text-foreground/60">
          {dictionary.daily.flashcardCounter
            .replace("{current}", String(index + 1))
            .replace("{total}", String(stack.cards.length))}
        </p>
      </div>
      <p className="text-sm text-foreground/60">{dictionary.daily.flashcardHint}</p>
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        className="ink-card flex min-h-52 flex-col items-center justify-center gap-3 rounded-[2rem] bg-surface p-7 text-center transition-transform hover:-rotate-1"
      >
        <span className="font-serif text-4xl font-semibold text-foreground">{card.front}</span>
        {revealed ? (
          <span className="font-hand text-3xl font-bold text-primary">{card.back}</span>
        ) : (
          <span className="text-sm text-primary-dark">{dictionary.daily.flashcardReveal}</span>
        )}
      </button>
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          className="h-12 rounded-control border-2 border-foreground bg-surface px-4 text-sm font-black hover:bg-white"
        >
          {dictionary.daily.flashcardPrev}
        </button>
        <button
          type="button"
          onClick={next}
          className="h-12 rounded-control border-2 border-foreground bg-surface px-4 text-sm font-black hover:bg-white"
        >
          {dictionary.daily.flashcardNext}
        </button>
      </div>
    </Card>
  );
}
