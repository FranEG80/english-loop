import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { CefrLevel } from "@/core/models";
import { getTaxonomy, searchLessonCatalogPage } from "@/core/use-cases";
import { CatalogFilters } from "@/features/catalog/CatalogFilters";
import { LessonCatalog } from "@/features/catalog/LessonCatalog";
import { CatalogPagination } from "@/features/catalog/CatalogPagination";
import { getDictionary } from "@/shared/i18n";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; level?: string; page?: string }>;
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
  const categories = taxonomy.filter((node) => node.type === "category");
  const category = categories.some((node) => node.id === params.category)
    ? params.category
    : undefined;
  const requestedPage = Number(params.page ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const lessonsPage = await searchLessonCatalogPage(
    content,
    { query: params.q, level, category },
    { page, pageSize: 12 },
  );

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
          resultCount={lessonsPage.total}
          fields={[
            {
              name: "category",
              label: dictionary.catalog.categoryLabel,
              allLabel: dictionary.catalog.allCategories,
              value: category,
              options: categories.map((node) => ({
                value: node.id,
                label: node.label[locale],
              })),
            },
          ]}
        />
        <CatalogPagination
          basePath="/lessons"
          dictionary={dictionary}
          page={lessonsPage.page}
          placement="top"
          totalItems={lessonsPage.total}
          totalPages={lessonsPage.totalPages}
          params={{ q: params.q, level, category }}
        />
        <LessonCatalog lessons={lessonsPage.items} dictionary={dictionary} />
        <CatalogPagination
          basePath="/lessons"
          dictionary={dictionary}
          page={lessonsPage.page}
          placement="bottom"
          totalItems={lessonsPage.total}
          totalPages={lessonsPage.totalPages}
          params={{ q: params.q, level, category }}
        />
      </div>
  );
}
