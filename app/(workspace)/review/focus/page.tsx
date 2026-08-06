import {
  getLearningContentPort,
  getLocalePort,
} from "@/adapters/adapter-factory";
import { getTaxonomy } from "@/core/use-cases";
import { createFocusedPracticeAction } from "@/features/review/actions";
import { FocusedPracticeConfigurator } from "@/features/review/FocusedPracticeConfigurator";
import { getDictionary } from "@/shared/i18n";

export default async function FocusPage({
  searchParams,
}: {
  searchParams: Promise<{ taxonomyNodeId?: string }>;
}) {
  const [locale, params, taxonomy] = await Promise.all([
    getLocalePort().getLocale(),
    searchParams,
    getTaxonomy(getLearningContentPort()),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="max-w-3xl">
        <p className="font-hand text-3xl font-bold text-coral">
          {dictionary.review.focusEyebrow}
        </p>
        <h1 className="text-5xl font-medium tracking-tight">
          {dictionary.review.focusTitle}
        </h1>
        <p className="mt-2 text-lg font-semibold text-foreground/65">
          {dictionary.review.focusDescription}
        </p>
      </header>
      <FocusedPracticeConfigurator
        action={createFocusedPracticeAction}
        copy={{
          common: dictionary.common,
          catalog: dictionary.catalog,
          review: dictionary.review,
        }}
        initialNodeId={params.taxonomyNodeId ?? "grammar"}
        locale={locale}
        taxonomy={taxonomy}
      />
    </div>
  );
}
