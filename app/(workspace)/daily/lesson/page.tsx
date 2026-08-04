import { redirect } from "next/navigation";
import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { requireSession } from "@/shared/lib/require-session";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { DailyLessonView } from "@/features/daily/DailyLessonView";

const TIMEZONE = "UTC";

export default async function DailyLessonPage() {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const dailySession = await getDailySessionPort().getTodaySession(TIMEZONE);
  const lesson = await getLearningContentPort().getLessonById(
    dailySession.recommendedLessonId,
  );

  if (!lesson) {
    redirect("/dashboard");
  }

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-6">
        <DailyLessonView dictionary={dictionary} lesson={lesson} />
      </div>
    </WorkspaceShell>
  );
}
