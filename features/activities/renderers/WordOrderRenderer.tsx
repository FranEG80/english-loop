"use client";

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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { ActivityResponseValue, WordOrderActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

export interface WordOrderRendererProps {
  activity: WordOrderActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

interface Token {
  id: string;
  text: string;
}

/**
 * Construcción de frase al estilo Duolingo: pulsar una ficha del banco la
 * manda a la frase y pulsarla en la frase la devuelve. El arrastre reordena
 * la ficha entera, sin botones de flecha ni de borrar por token, que era lo
 * que saturaba la zona de la frase.
 */
export function WordOrderRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: WordOrderRendererProps) {
  const [sentence, setSentence] = useState<Token[]>([]);
  const placed = new Set(sentence.map((token) => token.id));
  const bank = activity.tokens.filter((token) => !placed.has(token.id));
  const isComplete = sentence.length === activity.tokens.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function place(token: Token) {
    if (disabled) return;
    setSentence((current) => [...current, token]);
  }

  function remove(tokenId: string) {
    if (disabled) return;
    setSentence((current) => current.filter((token) => token.id !== tokenId));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSentence((current) => {
      const from = current.findIndex((token) => token.id === active.id);
      const to = current.findIndex((token) => token.id === over.id);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  }

  function submit() {
    if (disabled || !isComplete) return;
    // Se envían los IDs, no el texto: el evaluador compara contra
    // `correctTokenIds`. Mandar el texto hacía que ninguna respuesta fuese
    // nunca correcta.
    onSubmit({ kind: "ordered_list", value: sentence.map((token) => token.id) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-2xl font-medium">{dictionary.activities.wordOrderTitle}</h3>
        <p className="mt-1 text-sm font-semibold text-foreground/70">
          {activity.instructions}
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          {dictionary.activities.wordOrderHint}
        </p>
      </div>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {activity.context}
        </blockquote>
      ) : null}

      <section
        aria-labelledby="word-order-sentence"
        className="rounded-[1.5rem] border-2 border-dashed border-primary/40 bg-surface-muted/40 p-4"
      >
        <h4
          id="word-order-sentence"
          className="mb-3 text-xs font-black uppercase tracking-[.16em] text-primary"
        >
          {dictionary.activities.wordOrderSentenceLabel}
        </h4>
        {sentence.length === 0 ? (
          <p className="py-6 text-center text-foreground/50">
            {dictionary.activities.wordOrderEmptyHint}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={sentence.map((token) => token.id)}
              strategy={rectSortingStrategy}
            >
              <ol className="flex flex-wrap gap-2">
                {sentence.map((token) => (
                  <SortableChip
                    key={token.id}
                    token={token}
                    disabled={disabled}
                    label={dictionary.activities.removeFragment.replace("{word}", token.text)}
                    onActivate={() => remove(token.id)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section aria-labelledby="word-order-bank">
        <h4
          id="word-order-bank"
          className="mb-3 text-xs font-black uppercase tracking-[.16em] text-foreground/55"
        >
          {dictionary.activities.wordBankHint}
        </h4>
        {bank.length === 0 ? (
          <p className="text-sm font-bold text-success">
            ✓ {dictionary.activities.wordOrderAllPlaced}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {bank.map((token) => (
              <li key={token.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => place(token)}
                  aria-label={dictionary.activities.addFragment.replace("{word}", token.text)}
                  className="rounded-control border-2 border-foreground bg-surface px-4 py-2 text-lg font-bold shadow-[3px_4px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50"
                >
                  {token.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="sr-only" aria-live="polite">
        {sentence.map((token) => token.text).join(" ")}
      </p>

      <Button type="button" size="lg" onClick={submit} disabled={disabled || !isComplete}>
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}

interface SortableChipProps {
  token: Token;
  disabled?: boolean;
  label: string;
  onActivate: () => void;
}

/**
 * Ficha completa arrastrable. Se pulsa para devolverla al banco y se arrastra
 * para reordenar; con teclado, `Espacio` la coge y las flechas la mueven, que
 * es lo que sustituye a los botones de flecha eliminados.
 */
function SortableChip({ token, disabled, label, onActivate }: SortableChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: token.id,
    disabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-none", isDragging ? "z-20" : "")}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        onClick={onActivate}
        {...attributes}
        {...listeners}
        className={cn(
          "cursor-grab rounded-control border-2 border-foreground bg-accent px-4 py-2 text-lg font-bold shadow-[3px_4px_0_var(--color-foreground)] transition-transform active:cursor-grabbing disabled:opacity-50",
          isDragging ? "rotate-1 scale-[1.03]" : "hover:-translate-y-0.5",
        )}
      >
        {token.text}
      </button>
    </li>
  );
}
