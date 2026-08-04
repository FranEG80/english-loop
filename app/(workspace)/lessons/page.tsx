import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { CefrLevel } from "@/core/models";
import { listLessonCatalog } from "@/core/use-cases";
import { CatalogFilters } from "@/features/catalog/CatalogFilters";
import { LessonCatalog } from "@/features/catalog/LessonCatalog";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";

export default async function LessonsPage({
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
  const lessons = await listLessonCatalog(getLearningContentPort(), {
    query: params.q,
    level,
  });

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="flex flex-col gap-6">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Learn the pattern</p>
          <h1 className="text-5xl font-medium tracking-tight">{dictionary.catalog.lessonsTitle}</h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">
            {dictionary.catalog.lessonsDescription}
          </p>
        </header>
        <CatalogFilters
          dictionary={dictionary}
          clearHref="/lessons"
          query={params.q}
          level={level}
        />
        <LessonCatalog lessons={lessons} dictionary={dictionary} />
      </div>
    </WorkspaceShell>
  );
}
