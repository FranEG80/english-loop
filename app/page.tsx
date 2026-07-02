import {
  getAuthPort,
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getDailyLoop } from "@/core/use-cases";
import { DailyLessonView } from "@/features/daily/DailyLessonView";
import { getDictionary } from "@/shared/i18n";
import { PublicShell } from "@/shared/layout/PublicShell";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { Landing } from "@/features/landing/Landing";

const TIMEZONE = "UTC";

export default async function RootPage() {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const session = await getAuthPort().getSession();

  if (!session) {
    return (
      <PublicShell dictionary={dictionary} locale={locale}>
        <Landing dictionary={dictionary} locale={locale} />
      </PublicShell>
    );
  }

  const dailyLoop = await getDailyLoop(
    getDailySessionPort(),
    getLearningContentPort(),
    TIMEZONE,
  );

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      {dailyLoop.lesson ? (
        <DailyLessonView dictionary={dictionary} lesson={dailyLoop.lesson} />
      ) : (
        <p>{dictionary.states.emptyTitle}</p>
      )}
    </WorkspaceShell>
  );
}
