import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getActivityDetail } from "@/core/use-cases";
import { ActivityPreviewClient } from "@/features/activities/ActivityPreviewClient";
import {
  formatActivityTitle,
  formatActivityType,
  formatPresentation,
} from "@/features/activities/activity-display";
import { getDictionary } from "@/shared/i18n";
import { Badge } from "@/shared/ui/Badge";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId } = await params;
  const [locale, activity] = await Promise.all([
    getLocalePort().getLocale(),
    getActivityDetail(getLearningContentPort(), activityId),
  ]);
  if (!activity) notFound();
  const dictionary = getDictionary(locale);
  const activityTitle = formatActivityTitle(activity.id, activity.level);

  return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/activities"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-dark transition-colors hover:text-coral"
        >
          <span aria-hidden="true">←</span>
          {dictionary.nav.activities}
        </Link>
        <header className="flex max-w-5xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-hand text-2xl font-bold leading-none text-coral sm:text-3xl">
              {dictionary.catalog.activityLab}
            </p>
            <span className="hidden h-6 w-px bg-coral/30 sm:block" aria-hidden="true" />
            <Badge tone={activity.level === "B1" ? "b1" : "b2"}>
              {activity.level}
            </Badge>
            <Badge tone="neutral">{formatActivityType(activity.type)}</Badge>
          </div>
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            {activityTitle}
          </h1>
        </header>
        <ActivityPreviewClient activity={activity} dictionary={dictionary} />
        <dl className="grid max-w-5xl gap-3 rounded-card border border-border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-foreground/60">
              {dictionary.catalog.activityType}
            </dt>
            <dd className="font-medium">{formatActivityType(activity.type)}</dd>
          </div>
          <div>
            <dt className="text-sm text-foreground/60">
              {dictionary.catalog.presentation}
            </dt>
            <dd className="font-medium">{formatPresentation(activity.presentation)}</dd>
          </div>
        </dl>
        <Link
          href={`/review/focus?taxonomyNodeId=${encodeURIComponent(activity.taxonomyNodeId)}`}
          className="inline-flex h-12 w-fit items-center rounded-control bg-primary-dark px-5 font-medium text-white"
        >
          {dictionary.catalog.practiceTopic}
        </Link>
      </div>
  );
}
