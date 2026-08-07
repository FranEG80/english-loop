"use client";

import { useState } from "react";
import type { ActivityResponseValue, FreeTextActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

export interface FreeTextRendererProps {
  activity: FreeTextActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

/**
 * Producción libre de una frase: `error_correction`, `guided_writing` y
 * `sentence_rewrite`. La consigna se pinta siempre, que era lo que faltaba
 * para entender qué pide una corrección de errores.
 */
export function FreeTextRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: FreeTextRendererProps) {
  const [value, setValue] = useState("");
  const isEmpty = value.trim().length === 0;

  function submit() {
    if (disabled || isEmpty) return;
    onSubmit({ kind: "text", value: value.trim() });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      {activity.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {activity.context}
        </blockquote>
      ) : null}

      <p className="font-serif text-2xl leading-relaxed">{activity.prompt}</p>

      <Input
        id="free-text-answer"
        label={dictionary.activities.typeYourAnswer}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />

      <Button type="button" size="lg" onClick={submit} disabled={disabled || isEmpty}>
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}
