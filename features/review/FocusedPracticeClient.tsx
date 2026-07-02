"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  AttemptFeedbackDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { ActivityRenderer } from "@/features/activities/ActivityRenderer";
import { FeedbackPanel } from "@/features/activities/FeedbackPanel";
import { Button } from "@/shared/ui/Button";
import { Progress } from "@/shared/ui/Progress";
import { submitFocusedAttemptAction } from "./actions";

export function FocusedPracticeClient({
  runId,
  activities,
  dictionary,
}: {
  runId: string;
  activities: ActivityQuestionDto[];
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AttemptFeedbackDto | null>(null);
  const [pending, setPending] = useState(false);
  const activity = activities[index];
  const isLast = index === activities.length - 1;

  async function submit(response: ActivityResponseValue) {
    setPending(true);
    try {
      setFeedback(
        await submitFocusedAttemptAction(runId, {
          activityId: activity.id,
          response,
        }),
      );
    } finally {
      setPending(false);
    }
  }

  function next() {
    if (isLast) {
      router.push(`/review/session/${runId}/summary`);
      return;
    }
    setFeedback(null);
    setIndex((current) => current + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <Progress
        value={((index + 1) / activities.length) * 100}
        label={dictionary.daily.practiceProgress
          .replace("{current}", String(index + 1))
          .replace("{total}", String(activities.length))}
      />
      <ActivityRenderer
        key={activity.id}
        activity={activity}
        dictionary={dictionary}
        onSubmit={submit}
        disabled={pending || Boolean(feedback)}
      />
      {feedback ? (
        <div className="flex flex-col gap-4">
          <FeedbackPanel feedback={feedback} dictionary={dictionary} />
          <Button onClick={next} size="lg">
            {isLast ? dictionary.daily.finishSession : dictionary.daily.nextQuestion}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
