import Link from "next/link";
import {
  getLearningContentPort,
  getLocalePort,
  getProgressPort,
} from "@/adapters/adapter-factory";
import { getReviewHub, taxonomyLabel } from "@/core/use-cases";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";

export default async function ReviewPage() {
  const session = await requireSession();
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const hub = await getReviewHub(
    getProgressPort(),
    getLearningContentPort(),
  );

  const renderItems = (
    title: string,
    items: typeof hub.queue.dueItems,
  ) => (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <EmptyState title={dictionary.states.emptyTitle} className="py-6" />
      ) : (
        <ul className="stagger-in grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const activity = hub.activitiesById[item.activityId];
            return (
              <li key={item.id}>
                <Card className="lift-on-hover flex h-full flex-col gap-3">
                  <div className="flex gap-2">
                    <Badge tone={item.level === "B1" ? "b1" : "b2"}>
                      {item.level}
                    </Badge>
                    {activity ? <Badge tone="neutral">{activity.type}</Badge> : null}
                  </div>
                  <p className="text-2xl font-semibold">
                    {taxonomyLabel(hub.taxonomy, item.taxonomyNodeId, locale)}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {dictionary.review.attempts}: {item.attemptsCount} ·{" "}
                    {dictionary.review.dueDate}:{" "}
                    {new Intl.DateTimeFormat(locale).format(new Date(item.dueAt))}
                  </p>
                  <Link
                    href={`/activities/${item.activityId}`}
                    className="mt-auto font-medium text-primary-dark"
                  >
                    {dictionary.catalog.openActivity}
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-9">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Remember longer</p>
          <h1 className="text-5xl font-medium tracking-tight">{dictionary.review.title}</h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">{dictionary.review.description}</p>
        </header>
        <Card className="ink-card flex flex-col gap-4 bg-level-b2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-hand text-2xl font-bold text-level-b2-strong">Choose your route</p>
            <h2 className="text-3xl font-semibold">{dictionary.review.focusTitle}</h2>
            <p className="text-sm text-foreground/70">
              {dictionary.review.focusDescription}
            </p>
          </div>
          <Link
            href="/review/focus"
            className="inline-flex h-12 items-center rounded-control border-2 border-foreground bg-primary-dark px-5 font-black text-white shadow-[3px_4px_0_var(--color-foreground)]"
          >
            {dictionary.review.startFocus}
          </Link>
        </Card>
        {renderItems(dictionary.review.dueTitle, hub.queue.dueItems)}
        {renderItems(dictionary.review.upcomingTitle, hub.queue.upcomingItems)}
      </div>
    </WorkspaceShell>
  );
}
