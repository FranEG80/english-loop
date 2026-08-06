import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import {
  ACTIVITY_TYPES,
  INTERACTION_MODES,
  type CefrLevel,
} from "@/core/models";
import { getTaxonomy, listActivityCatalog } from "@/core/use-cases";
import { ActivityCatalog } from "@/features/catalog/ActivityCatalog";
import { CatalogFilters } from "@/features/catalog/CatalogFilters";
import { getDictionary } from "@/shared/i18n";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    interaction?: string;
    level?: string;
    q?: string;
    type?: string;
  }>;
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
  const activityType = ACTIVITY_TYPES.find((type) => type === params.type);
  const interactionMode = INTERACTION_MODES.find(
    (mode) => mode === params.interaction,
  );
  const activities = await listActivityCatalog(content, {
    query: params.q,
    level,
    taxonomyNodeId: category,
    type: activityType,
    interactionMode,
  });

  return (
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
          resultCount={activities.length}
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
            {
              name: "type",
              label: dictionary.catalog.activityType,
              allLabel: dictionary.catalog.allActivityTypes,
              value: activityType,
              options: ACTIVITY_TYPES.map((type) => ({
                value: type,
                label: type.replaceAll("_", " "),
              })),
            },
            {
              name: "interaction",
              label: dictionary.catalog.interactionMode,
              allLabel: dictionary.catalog.allInteractionModes,
              value: interactionMode,
              options: INTERACTION_MODES.map((mode) => ({
                value: mode,
                label: mode.replaceAll("_", " "),
              })),
            },
          ]}
        />
        <ActivityCatalog activities={activities} dictionary={dictionary} />
      </div>
  );
}
