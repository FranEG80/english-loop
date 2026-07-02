"use client";

import { useState } from "react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ActivityResponseValue, WordOrderActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { GripVertical } from "lucide-react";

interface WordItem {
  id: string;
  word: string;
}

function SortableWord({
  item,
  index,
  total,
  dictionary,
  disabled,
  onMove,
}: {
  item: WordItem;
  index: number;
  total: number;
  dictionary: Dictionary;
  disabled?: boolean;
  onMove: (from: number, to: number) => void;
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
        "flex items-center justify-between gap-3 rounded-2xl border-2 border-foreground bg-white px-4 py-3 text-base font-bold shadow-[2px_3px_0_rgba(18,42,47,.22)]",
        isDragging && "z-20 rotate-2 scale-105 bg-accent opacity-90 shadow-[5px_7px_0_var(--color-foreground)]",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="grid h-9 w-9 cursor-grab touch-none place-items-center rounded-xl bg-surface-muted text-foreground/60 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </span>
        {item.word}
      </span>
      <span className="flex gap-1">
        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
          aria-label={dictionary.activities.moveUp}
          className="h-8 w-8 rounded-lg bg-surface-muted text-xs hover:bg-accent disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label={dictionary.activities.moveDown}
          className="h-8 w-8 rounded-lg bg-surface-muted text-xs hover:bg-accent disabled:opacity-30"
        >
          ▼
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
  const [items, setItems] = useState<WordItem[]>(
    activity.shuffledWords.map((word, index) => ({ id: `${word}-${index}`, word })),
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function move(from: number, to: number) {
    if (disabled) return;
    setItems((prev) => arrayMove(prev, from, to));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function submit() {
    if (disabled) return;
    onSubmit({ kind: "ordered_list", value: items.map((item) => item.word) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-hand text-2xl font-bold text-coral">Drag to reorder</p>
        <p className="mt-1 text-sm font-semibold text-foreground/60">{dictionary.activities.wordOrderHint}</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="grid gap-3 sm:grid-cols-2">
            {items.map((item, index) => (
              <SortableWord
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                dictionary={dictionary}
                disabled={disabled}
                onMove={move}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <Button onClick={submit} disabled={disabled} size="lg">
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}
