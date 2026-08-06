import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { CefrLevel } from "@/core/models";
import { getTaxonomy, listLessonCatalog } from "@/core/use-cases";
import { CatalogFilters } from "@/features/catalog/CatalogFilters";
import { LessonCatalog } from "@/features/catalog/LessonCatalog";
import { getDictionary } from "@/shared/i18n";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; level?: string }>;
}) {
  const content = getLearningContentPort();
  const [locale, params, taxonomy] = await Promise.all([
    getLocalePort().getLocale(),
    searchParams,
    getTaxonomy(content),
  ]);
  const dictionary = getDictionary(locale);
  const level =
    params.level === "B1" || params.level === "B2"
      ? (params.level as CefrLevel)
      : undefined;
  const category = taxonomy.some((node) => node.id === params.category)
    ? params.category
    : undefined;
  const lessons = await listLessonCatalog(content, {
    query: params.q,
    level,
    category,
  });

  return (
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
          resultCount={lessons.length}
          fields={[
            {
              name: "category",
              label: dictionary.catalog.categoryLabel,
              allLabel: dictionary.catalog.allCategories,
              value: category,
              options: taxonomy.map((node) => ({
                value: node.id,
                label: node.label[locale],
              })),
            },
          ]}
        />
        <LessonCatalog lessons={lessons} dictionary={dictionary} />
      </div>
  );
}
