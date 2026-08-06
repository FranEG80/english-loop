import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { DailySummaryView } from "@/features/daily/DailySummaryView";

const TIMEZONE = "UTC";

export default async function DailySummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ correct?: string; incorrect?: string }>;
}) {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const params = await searchParams;

  const dailySession = await getDailySessionPort().getTodaySession(TIMEZONE);
  const [progress, taxonomyTree] = await Promise.all([
    getProgressPort().getOverview(),
    getLearningContentPort().getTaxonomyTree(),
  ]);

  return (
      <DailySummaryView
        dictionary={dictionary}
        locale={locale}
        dailySession={dailySession}
        progress={progress}
        taxonomyTree={taxonomyTree}
        correctCount={Number(params.correct ?? 0)}
        incorrectCount={Number(params.incorrect ?? 0)}
      />
  );
}
