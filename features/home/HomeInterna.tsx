import Link from "next/link";
import type { AuthSession, DailySessionDto, LessonSummaryDto, ProgressOverviewDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Badge, Card, Progress } from "@/shared/ui";
import { Mascot } from "@/shared/layout/Mascot";
import { WORKSPACE_NAV_ITEMS } from "@/shared/layout/nav-items";

export function HomeInterna({
  dictionary,
  session,
  dailySession,
  lesson,
  progress,
}: {
  dictionary: Dictionary;
  session: AuthSession;
  dailySession: DailySessionDto;
  lesson: LessonSummaryDto | null;
  progress: ProgressOverviewDto;
}) {
  const quickLinks = WORKSPACE_NAV_ITEMS.filter((item) => item.href !== "/");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Mascot pose="wave" size={72} />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {dictionary.home.greeting}, {session.name}
          </h1>
          <div className="mt-1 flex gap-2">
            {session.activeLevels.map((level) => (
              <Badge key={level} tone={level === "B1" ? "b1" : "b2"}>
                {level}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-foreground/70">
          {dictionary.home.recommendedLesson}
        </p>
        <p className="text-xl font-semibold text-foreground">
          {lesson?.title ?? "—"}
        </p>
        {lesson ? (
          <p className="text-sm text-foreground/70">{lesson.summary}</p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Progress
            value={
              (dailySession.goal.completedActivities /
                dailySession.goal.targetActivities) *
              100
            }
            label={dictionary.home.dailyGoal}
          />
          <p className="text-sm text-foreground/70">
            {dailySession.goal.completedActivities}/
            {dailySession.goal.targetActivities} — {dictionary.home.dailyGoal}
          </p>
        </div>
        <Link
          href="/daily"
          className="inline-flex h-12 w-fit items-center justify-center rounded-control bg-primary-dark px-5 text-base font-medium text-white transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
        >
          {dictionary.home.goToDaily}
        </Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-foreground/70">{dictionary.home.streak}</p>
          <p className="text-2xl font-bold text-coral">
            {dailySession.streakDays} 🔥
          </p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-foreground/70">{dictionary.home.accuracy}</p>
          <p className="text-2xl font-bold text-foreground">
            {Math.round(progress.accuracyRate * 100)}%
          </p>
        </Card>
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-foreground/70">
            {dictionary.home.pendingReviews}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {progress.pendingReviewCount}
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {dictionary.home.quickLinksTitle}
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map(({ href, labelKey, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-control border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"
            >
              <Icon className="h-5 w-5 text-primary-dark" aria-hidden="true" />
              {dictionary.nav[labelKey]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
