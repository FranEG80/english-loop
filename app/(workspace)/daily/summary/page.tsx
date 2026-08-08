import {
  getDailySessionPort,
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { getFocusedSummaryAction } from "@/features/review/actions";
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

  // Los fallos salen de los intentos guardados, no de la barra de direcciones:
  // el resumen tiene que poder explicar en qué te equivocaste.
  const runSummary = dailySession.practiceRunId
    ? await getFocusedSummaryAction(dailySession.practiceRunId).catch(() => null)
    : null;

  return (
      <DailySummaryView
        dictionary={dictionary}
        locale={locale}
        dailySession={dailySession}
        progress={progress}
        taxonomyTree={taxonomyTree}
        correctCount={runSummary?.correctCount ?? Number(params.correct ?? 0)}
        incorrectCount={runSummary?.incorrectCount ?? Number(params.incorrect ?? 0)}
        errors={runSummary?.errors ?? []}
      />
  );
}
