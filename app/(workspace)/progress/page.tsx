import {
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import { getProgressSnapshot, taxonomyLabel } from "@/core/use-cases";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { WeeklyActivityChart } from "@/features/progress/WeeklyActivityChart";

export default async function ProgressPage() {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const { overview, reviewQueue, taxonomy } = await getProgressSnapshot(
    getProgressPort(),
    getLearningContentPort(),
  );

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-8">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Track the loop</p>
          <h1 className="text-5xl font-medium tracking-tight">
            {dictionary.dashboard.progressTitle}
          </h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">
            {dictionary.dashboard.progressDescription}
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [dictionary.home.streak, overview.streakDays, "bg-accent"],
            [dictionary.home.accuracy, `${Math.round(overview.accuracyRate * 100)}%`, "bg-level-b1"],
            [dictionary.dashboard.lessonsViewed, overview.totalLessonsViewed, "bg-surface"],
            [dictionary.dashboard.activitiesCompleted, overview.totalActivitiesCompleted, "bg-coral text-white"],
          ].map(([label, value, color], index) => (
            <Card
              key={String(label)}
              className={`${color} ${index % 2 ? "sm:translate-y-3" : ""}`}
            >
              <p className="text-sm font-black uppercase tracking-wider opacity-65">
                {label}
              </p>
              <p className="mt-3 text-5xl font-black">{value}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <WeeklyActivityChart data={overview.weeklyActivity} locale={locale} />
          <Card className="flex flex-col items-center justify-center bg-accent p-7 text-center">
            <p className="font-hand text-3xl font-bold text-coral">
              {locale === "es" ? "Precisión global" : "Overall accuracy"}
            </p>
            <div
              role="img"
              aria-label={`${dictionary.home.accuracy}: ${Math.round(overview.accuracyRate * 100)}%`}
              className="relative mt-5 grid aspect-square w-44 place-items-center rounded-full border-2 border-foreground shadow-[4px_5px_0_var(--color-foreground)]"
              style={{
                background: `conic-gradient(var(--color-primary-dark) ${overview.accuracyRate * 360}deg, var(--color-surface) 0deg)`,
              }}
            >
              <div className="grid h-32 w-32 place-items-center rounded-full border-2 border-foreground bg-accent">
                <span className="text-5xl font-black">
                  {Math.round(overview.accuracyRate * 100)}%
                </span>
              </div>
            </div>
            <p className="mt-5 text-sm font-bold text-foreground/60">
              {locale === "es"
                ? "Aciertos acumulados en tus intentos."
                : "Correct answers across your attempts."}
            </p>
          </Card>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="flex flex-col gap-4 bg-success-surface">
            <h2 className="text-2xl font-semibold">{dictionary.dashboard.strongTopics}</h2>
            <div className="flex flex-wrap gap-2">
              {overview.strongTopicIds.map((id) => (
                <Badge key={id} tone="success">{taxonomyLabel(taxonomy, id, locale)}</Badge>
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-4 bg-danger-surface">
            <h2 className="text-2xl font-semibold">{dictionary.dashboard.weakTopics}</h2>
            <div className="flex flex-wrap gap-2">
              {overview.weakTopicIds.map((id) => (
                <Badge key={id} tone="danger">{taxonomyLabel(taxonomy, id, locale)}</Badge>
              ))}
            </div>
          </Card>
        </div>
        <p className="text-sm font-bold text-foreground/60">
          {dictionary.home.pendingReviews}: {reviewQueue.dueItems.length}
        </p>
      </div>
    </WorkspaceShell>
  );
}
