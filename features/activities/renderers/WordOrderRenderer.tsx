"use client";

import { useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, GripVertical, X } from "lucide-react";
import type { ActivityResponseValue, WordOrderActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

interface WordItem {
  id: string;
  word: string;
}

function labelFor(template: string, word: string) {
  return template.replace("{word}", word);
}

function SortableFragment({
  item,
  index,
  total,
  dictionary,
  disabled,
  onMove,
  onRemove,
}: {
  item: WordItem;
  index: number;
  total: number;
  dictionary: Dictionary;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (item: WordItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-2xl border-2 border-foreground bg-white p-1.5 text-base font-bold shadow-[2px_3px_0_rgba(18,42,47,.22)]",
        "motion-reduce:transition-none",
        disabled && "opacity-60",
        isDragging &&
          "z-20 rotate-1 scale-[1.03] bg-accent shadow-[5px_7px_0_var(--color-foreground)]",
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-8 min-w-8 place-items-center rounded-xl bg-primary font-mono text-xs font-black text-white"
      >
        {index + 1}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-label={labelFor(dictionary.activities.dragToReorder, item.word)}
        {...attributes}
        {...listeners}
        className="grid h-10 w-10 shrink-0 cursor-grab touch-none place-items-center rounded-xl bg-surface-muted text-foreground/65 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:cursor-grabbing disabled:cursor-not-allowed"
      >
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="min-w-0 break-words px-1.5 leading-tight">{item.word}</span>
      <span className="ml-1 flex gap-1 border-l-2 border-foreground/15 pl-1.5">
        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
          aria-label={labelFor(dictionary.activities.moveEarlier, item.word)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label={labelFor(dictionary.activities.moveLater, item.word)}
          className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(item)}
          aria-label={`${dictionary.activities.removeWord}: ${item.word}`}
          className="grid h-10 w-10 place-items-center rounded-xl text-foreground/55 hover:bg-danger-surface hover:text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export function WordOrderRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: WordOrderActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const [available, setAvailable] = useState<WordItem[]>(() =>
    activity.shuffledWords.map((word, index) => ({ id: `${word}-${index}`, word })),
  );
  const [sentence, setSentence] = useState<WordItem[]>([]);
  const bankLabelId = useId();
  const sentenceLabelId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addToSentence(item: WordItem) {
    if (disabled) return;
    setAvailable((previous) => previous.filter((word) => word.id !== item.id));
    setSentence((previous) => [...previous, item]);
  }

  function removeFromSentence(item: WordItem) {
    if (disabled) return;
    setSentence((previous) => previous.filter((word) => word.id !== item.id));
    setAvailable((previous) => [...previous, item]);
  }

  function move(from: number, to: number) {
    if (disabled) return;
    setSentence((previous) => {
      if (to < 0 || to >= previous.length) return previous;
      return arrayMove(previous, from, to);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSentence((previous) => {
      const oldIndex = previous.findIndex((item) => item.id === active.id);
      const newIndex = previous.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return previous;
      return arrayMove(previous, oldIndex, newIndex);
    });
  }

  function submit() {
    if (disabled || sentence.length !== activity.shuffledWords.length) return;
    onSubmit({ kind: "ordered_list", value: sentence.map((item) => item.word) });
  }

  const isComplete = sentence.length > 0 && sentence.length === activity.shuffledWords.length;
  const sentenceText = sentence.map((item) => item.word).join(" ");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p aria-hidden="true" className="mb-1 font-mono text-xs font-black tracking-[.2em] text-primary">
          1 → 2 → 3
        </p>
        <h3 className="font-hand text-3xl font-bold text-coral">
          {dictionary.activities.wordOrderTitle}
        </h3>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-foreground/70">
          {dictionary.activities.wordOrderHint}
        </p>
      </div>

      <section
        aria-labelledby={bankLabelId}
        className="rounded-[1.5rem] border-2 border-foreground/25 bg-surface-muted/75 p-4 sm:p-5"
      >
        <h4 id={bankLabelId} className="text-xs font-black uppercase tracking-[.14em] text-foreground/65">
          {dictionary.activities.wordBankHint}
        </h4>
        <div className="mt-3 flex min-h-12 flex-wrap items-center gap-2.5">
          {available.length > 0 ? (
            available.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => addToSentence(item)}
                className="min-h-11 rounded-2xl border-2 border-foreground bg-white px-4 py-2 text-left text-base font-bold text-foreground shadow-[2px_3px_0_rgba(18,42,47,.18)] transition-transform hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-55"
              >
                {item.word}
              </button>
            ))
          ) : (
            <p className="text-sm font-bold text-primary">
              ✓ {dictionary.activities.wordOrderAllPlaced}
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby={sentenceLabelId}
        className="rounded-[1.75rem] border-2 border-primary bg-level-b1/45 p-4 shadow-[3px_4px_0_rgba(18,42,47,.16)] sm:p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <h4 id={sentenceLabelId} className="text-sm font-black uppercase tracking-[.14em] text-primary-dark">
            {dictionary.activities.wordOrderSentenceLabel}
          </h4>
          <span aria-hidden="true" className="font-mono text-xs font-bold text-primary/70">
            →
          </span>
        </div>
        <div className="mt-3 min-h-24 rounded-2xl border-2 border-dashed border-primary/55 bg-white/65 p-3 sm:p-4">
          {sentence.length === 0 ? (
            <p className="grid min-h-14 place-items-center text-center text-sm font-semibold text-foreground/55">
              {dictionary.activities.wordOrderEmptyHint}
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={sentence.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <ol className="flex min-w-0 flex-wrap items-center gap-3">
                  {sentence.map((item, index) => (
                    <SortableFragment
                      key={item.id}
                      item={item}
                      index={index}
                      total={sentence.length}
                      dictionary={dictionary}
                      disabled={disabled}
                      onMove={move}
                      onRemove={removeFromSentence}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {dictionary.activities.wordOrderSentenceLabel}: {sentenceText}
      </p>

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto sm:min-w-60"
          onClick={submit}
          disabled={disabled || !isComplete}
          size="lg"
        >
          {dictionary.daily.submitAnswer}
        </Button>
      </div>
    </div>
  );
}
