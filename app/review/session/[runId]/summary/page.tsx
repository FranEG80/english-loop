import Link from "next/link";
import { getLocalePort } from "@/adapters/adapter-factory";
import { getFocusedSummaryAction } from "@/features/review/actions";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Card } from "@/shared/ui/Card";

export default async function FocusedSummaryPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const [session, locale, summary] = await Promise.all([
    requireSession(),
    getLocalePort().getLocale(),
    getFocusedSummaryAction(runId),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 text-center">
        <p className="font-hand text-3xl font-bold text-coral">Focused loop complete!</p>
        <h1 className="text-6xl font-medium">{dictionary.daily.summaryTitle}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p>{dictionary.daily.summaryCorrect}</p>
            <p className="text-5xl font-black text-success">{summary.correctCount}</p>
          </Card>
          <Card>
            <p>{dictionary.daily.summaryIncorrect}</p>
            <p className="text-5xl font-black text-danger">{summary.incorrectCount}</p>
          </Card>
        </div>
        <Link href="/review/focus" className="font-medium text-primary-dark">
          {dictionary.review.startFocus}
        </Link>
      </div>
    </WorkspaceShell>
  );
}
