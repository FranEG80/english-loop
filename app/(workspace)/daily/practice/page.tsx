import { redirect } from "next/navigation";
import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getDailyLoop } from "@/core/use-cases";
import { getDictionary } from "@/shared/i18n";
import { DailyPracticeClient } from "@/features/daily/DailyPracticeClient";

const TIMEZONE = "UTC";

export default async function DailyPracticePage() {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const { dailySession, activities } = await getDailyLoop(
    getDailySessionPort(),
    getLearningContentPort(),
    TIMEZONE,
  );

  if (activities.length === 0) {
    redirect("/daily/lesson");
  }

  return (
      <DailyPracticeClient
        sessionId={dailySession.id}
        activities={activities}
        dictionary={dictionary}
      />
  );
}
