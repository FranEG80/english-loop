"use client";

import { useState } from "react";
import type {
  ActivityResponseValue,
  CompleteDialogueActivityDto,
  CompleteParagraphActivityDto,
  ErrorCorrectionActivityDto,
  FillBlankActivityDto,
  KeyWordTransformationActivityDto,
  OpenClozeActivityDto,
  RewriteSentenceActivityDto,
  WordFormationActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button, Input } from "@/shared/ui";

type TextActivity =
  | FillBlankActivityDto
  | ErrorCorrectionActivityDto
  | WordFormationActivityDto
  | KeyWordTransformationActivityDto
  | RewriteSentenceActivityDto
  | OpenClozeActivityDto
  | CompleteParagraphActivityDto
  | CompleteDialogueActivityDto;

function gapCountFor(activity: TextActivity): number {
  if (activity.type === "open_cloze" || activity.type === "complete_paragraph") {
    return activity.gapCount;
  }
  if (activity.type === "complete_dialogue") {
    return activity.dialogueLines.filter((line) => line.hasGap).length;
  }
  return 1;
}

export function TextResponseRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: {
  activity: TextActivity;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}) {
  const gapCount = gapCountFor(activity);
  const [values, setValues] = useState<string[]>(() => Array(gapCount).fill(""));

  function setValueAt(index: number, value: string) {
    setValues((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  const isIncomplete = values.some((value) => value.trim() === "");

  function submit() {
    if (disabled || isIncomplete) return;
    onSubmit(
      gapCount > 1
        ? { kind: "ordered_list", value: values }
        : { kind: "text", value: values[0] },
    );
  }

  return (
    <div className="activity-text-response flex flex-col gap-5">
      {renderPrompt(activity, dictionary, values, setValueAt, disabled)}
      <Button onClick={submit} disabled={disabled || isIncomplete} size="lg">
        {dictionary.daily.submitAnswer}
      </Button>
    </div>
  );
}

function renderPrompt(
  activity: TextActivity,
  dictionary: Dictionary,
  values: string[],
  setValueAt: (index: number, value: string) => void,
  disabled?: boolean,
) {
  switch (activity.type) {
    case "fill_blank":
      return (
        <>
          <p className="text-lg font-medium text-foreground">{activity.textWithGap}</p>
          <Input
            id="text-response-0"
            label={dictionary.activities.typeYourAnswer}
            value={values[0]}
            disabled={disabled}
            onChange={(event) => setValueAt(0, event.target.value)}
          />
        </>
      );
    case "error_correction":
      return (
        <>
          <p className="text-lg font-medium text-foreground">{activity.sentenceWithError}</p>
          <Input
            id="text-response-0"
            label={dictionary.activities.typeYourAnswer}
            value={values[0]}
            disabled={disabled}
            onChange={(event) => setValueAt(0, event.target.value)}
          />
        </>
      );
    case "word_formation":
      return (
        <>
          <p className="text-lg font-medium text-foreground">{activity.sentenceWithGap}</p>
          <p className="text-sm font-semibold text-foreground/60">{activity.baseWord}</p>
          <Input
            id="text-response-0"
            label={dictionary.activities.typeYourAnswer}
            value={values[0]}
            disabled={disabled}
            onChange={(event) => setValueAt(0, event.target.value)}
          />
        </>
      );
    case "key_word_transformation":
      return (
        <>
          <p className="text-lg font-medium text-foreground">{activity.firstSentence}</p>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-dark">
            {activity.keyword}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg text-foreground">{activity.secondSentenceStart}</span>
            <Input
              id="text-response-0"
              label={dictionary.activities.typeYourAnswer}
              value={values[0]}
              disabled={disabled}
              onChange={(event) => setValueAt(0, event.target.value)}
            />
          </div>
        </>
      );
    case "rewrite_sentence":
      return (
        <>
          <p className="text-lg font-medium text-foreground">{activity.originalSentence}</p>
          <p className="text-sm text-foreground/60">{activity.constraintHint}</p>
          <Input
            id="text-response-0"
            label={dictionary.activities.typeYourAnswer}
            value={values[0]}
            disabled={disabled}
            onChange={(event) => setValueAt(0, event.target.value)}
          />
        </>
      );
    case "open_cloze":
    case "complete_paragraph": {
      const text =
        activity.type === "open_cloze" ? activity.textWithGaps : activity.paragraphWithGaps;
      return (
        <>
          <p className="text-lg font-medium text-foreground">{text}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {values.map((value, index) => (
              <Input
                key={index}
                id={`text-response-${index}`}
                label={dictionary.activities.gapHint.replace("{index}", String(index + 1))}
                value={value}
                disabled={disabled}
                onChange={(event) => setValueAt(index, event.target.value)}
              />
            ))}
          </div>
        </>
      );
    }
    case "complete_dialogue": {
      let gapIndex = -1;
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground/60">{dictionary.activities.dialogueHint}</p>
          {activity.dialogueLines.map((line, lineIndex) => {
            if (!line.hasGap) {
              return (
                <p key={lineIndex} className="text-base text-foreground">
                  <span className="font-semibold">{line.speaker}:</span> {line.text}
                </p>
              );
            }
            gapIndex += 1;
            const index = gapIndex;
            return (
              <div key={lineIndex} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{line.speaker}:</span>
                <Input
                  id={`text-response-${index}`}
                  label={dictionary.activities.gapHint.replace("{index}", String(index + 1))}
                  value={values[index] ?? ""}
                  disabled={disabled}
                  onChange={(event) => setValueAt(index, event.target.value)}
                />
              </div>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
}
