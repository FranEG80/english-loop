import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { requireSession } from "@/shared/lib/require-session";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { DailySummaryView } from "@/features/daily/DailySummaryView";

const TIMEZONE = "UTC";

export default async function DailySummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ correct?: string; incorrect?: string }>;
}) {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const params = await searchParams;

  const dailySession = await getDailySessionPort().getTodaySession(TIMEZONE);
  const [progress, taxonomyTree] = await Promise.all([
    getProgressPort().getOverview(),
    getLearningContentPort().getTaxonomyTree(),
  ]);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <DailySummaryView
        dictionary={dictionary}
        locale={locale}
        dailySession={dailySession}
        progress={progress}
        taxonomyTree={taxonomyTree}
        correctCount={Number(params.correct ?? 0)}
        incorrectCount={Number(params.incorrect ?? 0)}
      />
    </WorkspaceShell>
  );
}
