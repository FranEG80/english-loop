import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { CefrLevel } from "@/core/models";
import { listActivityCatalog } from "@/core/use-cases";
import { ActivityCatalog } from "@/features/catalog/ActivityCatalog";
import { CatalogFilters } from "@/features/catalog/CatalogFilters";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string }>;
}) {
  const session = await requireSession();
  const [locale, params] = await Promise.all([
    getLocalePort().getLocale(),
    searchParams,
  ]);
  const dictionary = getDictionary(locale);
  const level =
    params.level === "B1" || params.level === "B2"
      ? (params.level as CefrLevel)
      : undefined;
  const activities = await listActivityCatalog(getLearningContentPort(), {
    query: params.q,
    level,
  });

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-6">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Try every format</p>
          <h1 className="text-5xl font-medium tracking-tight">
            {dictionary.catalog.activitiesTitle}
          </h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">
            {dictionary.catalog.activitiesDescription}
          </p>
        </header>
        <CatalogFilters
          dictionary={dictionary}
          clearHref="/activities"
          query={params.q}
          level={level}
        />
        <ActivityCatalog activities={activities} dictionary={dictionary} />
      </div>
    </WorkspaceShell>
  );
}
