import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import type { TaxonomyNodeDto } from "@/core/models";
import { getTaxonomy } from "@/core/use-cases";
import { createFocusedPracticeAction } from "@/features/review/actions";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";
import { Card } from "@/shared/ui/Card";

function flatten(nodes: TaxonomyNodeDto[]): TaxonomyNodeDto[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ taxonomyNodeId?: string }>;
}) {
  const [session, locale, params, taxonomy] = await Promise.all([
    requireSession(),
    getLocalePort().getLocale(),
    searchParams,
    getTaxonomy(getLearningContentPort()),
  ]);
  const dictionary = getDictionary(locale);
  const nodes = flatten(taxonomy);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <p className="font-hand text-3xl font-bold text-coral">Build your own loop</p>
          <h1 className="text-5xl font-medium tracking-tight">{dictionary.review.focusTitle}</h1>
          <p className="mt-2 text-lg font-semibold text-foreground/65">
            {dictionary.review.focusDescription}
          </p>
        </header>
        <Card className="p-7 sm:p-9">
          <form action={createFocusedPracticeAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 font-medium">
              Tema
              <select
                name="taxonomyNodeId"
                defaultValue={params.taxonomyNodeId ?? "grammar"}
                className="h-12 rounded-control border-2 border-foreground/50 bg-surface px-3"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label[locale]} ({node.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-medium">
              {dictionary.catalog.levelLabel}
              <select
                name="level"
                className="h-12 rounded-control border-2 border-foreground/50 bg-surface px-3"
              >
                <option value="both">{dictionary.catalog.allLevels}</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 font-medium">
              Número de actividades
              <select
                name="sessionSize"
                className="h-12 rounded-control border-2 border-foreground/50 bg-surface px-3"
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button className="h-12 rounded-control border-2 border-foreground bg-primary-dark px-5 font-black text-white shadow-[3px_4px_0_var(--color-foreground)]">
              {dictionary.common.start}
            </button>
          </form>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
