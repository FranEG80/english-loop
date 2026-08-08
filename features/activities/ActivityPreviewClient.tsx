"use client";

import { useState, useTransition } from "react";
import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  AttemptFeedbackDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { ActivityRenderer } from "./ActivityRenderer";
import { FeedbackPanel } from "./FeedbackPanel";

/**
 * Previsualización del catálogo. Corrige de verdad: entrar en una actividad y
 * responderla dice si está bien y por qué.
 *
 * La corrección va contra un endpoint que **no registra intento**, así que no
 * cuenta como práctica ni mueve el repaso espaciado. El aviso bajo la
 * actividad lo deja claro.
 */
export function ActivityPreviewClient({
  activity,
  dictionary,
}: {
  activity: ActivityQuestionDto;
  dictionary: Dictionary;
}) {
  const [feedback, setFeedback] = useState<AttemptFeedbackDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [isChecking, startChecking] = useTransition();

  function check(response: ActivityResponseValue) {
    setFailed(false);
    startChecking(async () => {
      try {
        const result = await fetch(
          `/api/v1/activities/${encodeURIComponent(activity.id)}/check`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ response }),
          },
        );
        if (!result.ok) throw new Error(String(result.status));
        setFeedback((await result.json()) as AttemptFeedbackDto);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ActivityRenderer
        activity={activity}
        dictionary={dictionary}
        onSubmit={check}
        disabled={isChecking || Boolean(feedback)}
        feedback={feedback}
      />

      {feedback ? <FeedbackPanel feedback={feedback} dictionary={dictionary} /> : null}

      {failed ? (
        <p className="text-sm font-bold text-danger" role="alert">
          {dictionary.states.errorTitle}
        </p>
      ) : null}

      <p className="text-sm text-foreground/70" role="status">
        {dictionary.catalog.previewNotice}
      </p>

      {feedback || failed ? (
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setFailed(false);
          }}
          className="h-12 w-fit rounded-control border border-border-interactive px-4 font-medium"
        >
          {dictionary.common.retry}
        </button>
      ) : null}
    </div>
  );
}
