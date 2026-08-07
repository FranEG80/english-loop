"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  ActivityResponseValue,
  ActivitySegment,
  GapFillActivityDto,
  KeyWordTransformationActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";

export interface GapFillRendererProps {
  activity: GapFillActivityDto | KeyWordTransformationActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

/**
 * Huecos escritos **dentro de la propia frase**, no en una caja debajo. El
 * texto llega ya segmentado desde el servidor (`parseGapSegments`), así que
 * aquí solo se decide cómo se pinta cada trozo.
 *
 * Cubre `gap_fill`, `word_formation` (con chip de raíz) y
 * `key_word_transformation` (con frase original y chip de palabra clave).
 */
export function GapFillRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: GapFillRendererProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const totalGaps = activity.gapIds.length;
  const isIncomplete = activity.gapIds.some((gapId) => !(answers[gapId] ?? "").trim());

  const cue =
    activity.presentation === "key_word_transformation"
      ? { label: dictionary.activities.keyWordLabel, value: activity.keyWord }
      : activity.cueWord
        ? { label: dictionary.activities.cueWordLabel, value: activity.cueWord }
        : null;

  function submit() {
    if (disabled || isIncomplete) return;
    onSubmit({
      kind: "gaps",
      value: activity.gapIds.map((gapId) => ({
        gapId,
        text: (answers[gapId] ?? "").trim(),
      })),
    });
  }

  return (
    <div className="activity-gap-fill flex flex-col gap-5">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {activity.context}
        </blockquote>
      ) : null}

      {activity.presentation === "key_word_transformation" ? (
        <p className="font-serif text-xl leading-relaxed">{activity.firstSentence}</p>
      ) : activity.question ? (
        <p className="font-serif text-xl leading-relaxed">{activity.question}</p>
      ) : null}

      {cue?.value ? (
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="text-foreground/60">{cue.label}</span>
          <span className="rounded-control border-2 border-foreground bg-accent px-3 py-1 tracking-[.14em]">
            {cue.value}
          </span>
        </p>
      ) : null}

      <GapText
        segments={activity.segments}
        answers={answers}
        totalGaps={totalGaps}
        dictionary={dictionary}
        disabled={disabled}
        layout={activity.presentation === "gap_fill" ? activity.layout : "sentence"}
        onChange={(gapId, value) =>
          setAnswers((current) => ({ ...current, [gapId]: value }))
        }
        onEnter={submit}
      />

      {activity.presentation === "key_word_transformation" ? (
        <p className="text-sm text-foreground/60">
          {dictionary.activities.maxWordsHint.replace("{count}", String(activity.maxWords))}
        </p>
      ) : null}

      <Button type="button" size="lg" onClick={submit} disabled={disabled || isIncomplete}>
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}

interface GapTextProps {
  segments: readonly ActivitySegment[];
  answers: Record<string, string>;
  totalGaps: number;
  dictionary: Dictionary;
  disabled?: boolean;
  layout: "sentence" | "paragraph" | "dialogue";
  onChange: (gapId: string, value: string) => void;
  onEnter: () => void;
}

function GapText({
  segments,
  answers,
  totalGaps,
  dictionary,
  disabled,
  layout,
  onChange,
  onEnter,
}: GapTextProps) {
  // Los saltos de línea agrupan los segmentos en filas, para que un diálogo o
  // un párrafo se lean como tales sin perder los huecos en línea.
  const lines = useMemo(() => splitIntoLines(segments), [segments]);

  return (
    <div
      className={cn(
        "flex flex-col",
        layout === "dialogue" ? "gap-3" : "gap-1",
        layout === "paragraph" ? "leading-loose" : "",
      )}
    >
      {lines.map((line, lineIndex) => (
        <p
          key={lineIndex}
          className={cn(
            "font-serif text-xl leading-relaxed",
            layout === "dialogue" ? "flex flex-wrap items-baseline gap-x-2" : "",
          )}
        >
          {line.map((segment, index) =>
            renderSegment(segment, `${lineIndex}-${index}`, {
              answers,
              totalGaps,
              dictionary,
              disabled,
              onChange,
              onEnter,
            }),
          )}
        </p>
      ))}
    </div>
  );
}

interface SegmentContext {
  answers: Record<string, string>;
  totalGaps: number;
  dictionary: Dictionary;
  disabled?: boolean;
  onChange: (gapId: string, value: string) => void;
  onEnter: () => void;
}

function renderSegment(
  segment: ActivitySegment,
  key: string,
  context: SegmentContext,
): ReactNode {
  if (segment.kind === "text") return <span key={key}>{segment.value}</span>;

  if (segment.kind === "speaker") {
    return (
      <span
        key={key}
        className="shrink-0 rounded-control bg-surface-muted px-2 py-0.5 text-sm font-black uppercase tracking-[.1em] text-primary"
      >
        {segment.label}
      </span>
    );
  }

  if (segment.kind === "break") return null;

  const label = context.dictionary.activities.gapOfTotal
    .replace("{index}", String(segment.position))
    .replace("{total}", String(context.totalGaps));

  return (
    <input
      key={key}
      type="text"
      inputMode="text"
      autoComplete="off"
      aria-label={label}
      value={context.answers[segment.gapId] ?? ""}
      disabled={context.disabled}
      onChange={(event) => context.onChange(segment.gapId, event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          context.onEnter();
        }
      }}
      // `field-sizing: content` hace que el hueco crezca con lo escrito y se
      // lea como parte de la frase, no como un formulario aparte.
      className="mx-1 inline-block min-w-[7ch] max-w-full rounded-none border-0 border-b-[3px] border-dashed border-primary bg-accent/25 px-2 py-0.5 text-center font-sans text-lg font-bold text-foreground transition-colors focus:border-solid focus:border-coral focus:outline-none disabled:opacity-60 [field-sizing:content]"
    />
  );
}

function splitIntoLines(segments: readonly ActivitySegment[]): ActivitySegment[][] {
  const lines: ActivitySegment[][] = [[]];
  for (const segment of segments) {
    if (segment.kind === "break") lines.push([]);
    else lines.at(-1)!.push(segment);
  }
  return lines.filter((line) => line.length > 0);
}
