"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { ActivityQuestionDto, ActivityResponseValue } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { TrueFalseRenderer } from "./renderers/TrueFalseRenderer";
import { ChoiceRenderer } from "./renderers/ChoiceRenderer";
import { TextResponseRenderer } from "./renderers/TextResponseRenderer";
import { SentenceBuilderRenderer } from "./renderers/SentenceBuilderRenderer";
import { MatchingRenderer } from "./renderers/MatchingRenderer";
import { WordOrderRenderer } from "./renderers/WordOrderRenderer";
import { UnsupportedActivity } from "./UnsupportedActivity";
import { ACTIVITY_ILLUSTRATION_BY_TYPE } from "./illustrations";

export interface ActivityRendererProps {
  activity: ActivityQuestionDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

/**
 * Registro exhaustivo por tipo de actividad. `interactionMode` decide la
 * presentación (swipe, drag_drop, matching_pairs, sentence_builder,
 * standard); la corrección nunca vive aquí, solo en el adapter mock.
 */
export function ActivityRenderer({ activity, dictionary, onSubmit, disabled }: ActivityRendererProps) {
  let renderer: ReactNode;

  switch (activity.type) {
    case "true_false":
      renderer = (
        <TrueFalseRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    case "single_choice":
    case "multiple_choice":
      renderer = (
        <ChoiceRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    case "fill_blank":
    case "error_correction":
    case "word_formation":
    case "key_word_transformation":
    case "rewrite_sentence":
    case "open_cloze":
    case "complete_paragraph":
    case "complete_dialogue":
      renderer = (
        <TextResponseRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    case "sentence_transformation":
      renderer = (
        <SentenceBuilderRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    case "matching":
      renderer = (
        <MatchingRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    case "word_order":
      renderer = (
        <WordOrderRenderer
          activity={activity}
          dictionary={dictionary}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
      break;
    default:
      return <UnsupportedActivity dictionary={dictionary} />;
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-foreground bg-surface shadow-[6px_8px_0_var(--color-foreground)]">
      <header className="flex items-center justify-between gap-4 border-b-2 border-foreground bg-surface-muted px-5 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-primary">
            {activity.type.replaceAll("_", " ")}
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground/60">
            {activity.level} · {activity.interactionMode.replaceAll("_", " ")}
          </p>
        </div>
        <span className="font-hand -rotate-2 text-2xl font-bold text-coral">
          Your turn!
        </span>
      </header>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(12rem,17rem)]">
        <div className="min-w-0 p-5 sm:p-7 lg:p-9">{renderer}</div>
        <aside className="relative hidden min-h-64 border-l-2 border-foreground bg-accent/35 lg:block">
          <Image
            src={ACTIVITY_ILLUSTRATION_BY_TYPE[activity.type]}
            alt=""
            fill
            sizes="272px"
            className="object-contain p-5"
          />
        </aside>
      </div>
    </section>
  );
}
