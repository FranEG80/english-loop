import Link from "next/link";
import type { DailySessionDto, Locale, ProgressOverviewDto, TaxonomyNodeDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Badge, Card } from "@/shared/ui";
import { Mascot } from "@/shared/layout/Mascot";

function findNodeLabel(nodes: TaxonomyNodeDto[], id: string, locale: Locale): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.label[locale];
    const found = findNodeLabel(node.children, id, locale);
    if (found) return found;
  }
  return null;
}

export function DailySummaryView({
  dictionary,
  locale,
  dailySession,
  progress,
  taxonomyTree,
  correctCount,
  incorrectCount,
}: {
  dictionary: Dictionary;
  locale: Locale;
  dailySession: DailySessionDto;
  progress: ProgressOverviewDto;
  taxonomyTree: TaxonomyNodeDto[];
  correctCount: number;
  incorrectCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <div className="loopy-float">
        <Mascot pose="celebrate" size={170} priority className="!rounded-none !bg-transparent" />
      </div>
      <p className="font-hand -mb-5 text-3xl font-bold text-coral">Loop complete!</p>
      <h1 className="text-6xl font-medium tracking-tight text-foreground">{dictionary.daily.summaryTitle}</h1>
      <p className="text-lg font-semibold text-foreground/65">{dictionary.daily.summarySubtitle}</p>

      <div className="grid w-full gap-4 sm:grid-cols-4">
        <Card className="flex flex-col gap-1 bg-success-surface">
          <p className="text-sm text-foreground/70">{dictionary.daily.summaryCorrect}</p>
          <p className="text-5xl font-black text-success">{correctCount}</p>
        </Card>
        <Card className="flex flex-col gap-1 bg-danger-surface">
          <p className="text-sm text-foreground/70">{dictionary.daily.summaryIncorrect}</p>
          <p className="text-5xl font-black text-danger">{incorrectCount}</p>
        </Card>
        <Card className="flex flex-col gap-1 bg-accent">
          <p className="text-sm text-foreground/70">{dictionary.home.streak}</p>
          <p className="text-5xl font-black text-coral">{dailySession.streakDays} 🔥</p>
        </Card>
        <Card className="flex flex-col gap-1 bg-level-b2">
          <p className="text-sm text-foreground/70">{dictionary.daily.summaryNextReview}</p>
          <p className="text-5xl font-black text-foreground">{progress.pendingReviewCount}</p>
        </Card>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 text-left">
          <p className="font-semibold text-foreground">{dictionary.daily.summaryStrongTopics}</p>
          <div className="flex flex-wrap gap-2">
            {progress.strongTopicIds.map((id) => (
              <Badge key={id} tone="success">
                {findNodeLabel(taxonomyTree, id, locale) ?? id}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-2 text-left">
          <p className="font-semibold text-foreground">{dictionary.daily.summaryWeakTopics}</p>
          <div className="flex flex-wrap gap-2">
            {progress.weakTopicIds.map((id) => (
              <Badge key={id} tone="danger">
                {findNodeLabel(taxonomyTree, id, locale) ?? id}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      <Link
        href="/"
        className="inline-flex h-14 items-center justify-center rounded-control border-2 border-foreground bg-primary-dark px-7 text-lg font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1"
      >
        {dictionary.daily.summaryBackHome}
      </Link>
    </div>
  );
}
