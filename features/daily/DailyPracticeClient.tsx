"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  ActivityQuestionDto,
  ActivityResponseValue,
  AttemptFeedbackDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { ActivityRenderer } from "@/features/activities/ActivityRenderer";
import { FeedbackPanel } from "@/features/activities/FeedbackPanel";
import { Progress, Button } from "@/shared/ui";
import { completeDailySessionAction, submitDailyAttemptAction } from "./actions";

export function DailyPracticeClient({
  sessionId,
  activities,
  dictionary,
}: {
  sessionId: string;
  activities: ActivityQuestionDto[];
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<AttemptFeedbackDto | null>(null);
  const [pending, setPending] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  const activity = activities[index];
  const isLast = index === activities.length - 1;
  const progressLabel = dictionary.daily.practiceProgress
    .replace("{current}", String(index + 1))
    .replace("{total}", String(activities.length));

  async function handleSubmit(response: ActivityResponseValue) {
    setPending(true);
    const result = await submitDailyAttemptAction(sessionId, {
      activityId: activity.id,
      response,
    });
    setFeedback(result);
    if (result.isCorrect) setCorrectCount((prev) => prev + 1);
    else setIncorrectCount((prev) => prev + 1);
    setPending(false);
  }

  async function handleNext() {
    if (isLast) {
      setPending(true);
      await completeDailySessionAction(sessionId);
      router.push(`/daily/summary?correct=${correctCount}&incorrect=${incorrectCount}`);
      return;
    }
    setFeedback(null);
    setIndex((prev) => prev + 1);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7">
      <div className="flex flex-col gap-3 rounded-2xl border border-foreground/20 bg-surface/80 p-4">
        <div className="flex items-center justify-between">
          <p className="font-hand text-2xl font-bold text-coral">Daily practice</p>
          <p className="text-sm font-black uppercase tracking-wider text-foreground/55">{progressLabel}</p>
        </div>
        <Progress value={((index + 1) / activities.length) * 100} label={progressLabel} />
      </div>
      <ActivityRenderer
        key={activity.id}
        activity={activity}
        dictionary={dictionary}
        onSubmit={handleSubmit}
        disabled={Boolean(feedback) || pending}
      />
      {feedback ? (
        <div className="flex flex-col gap-4 rounded-[2rem]">
          <FeedbackPanel feedback={feedback} dictionary={dictionary} />
          <Button onClick={handleNext} size="lg" disabled={pending}>
            {isLast ? dictionary.daily.finishSession : dictionary.daily.nextQuestion}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
