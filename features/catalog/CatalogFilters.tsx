import Link from "next/link";
import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Dictionary } from "@/shared/i18n";

export interface CatalogFilterOption {
  label: string;
  value: string;
}

export interface CatalogFilterField {
  allLabel: string;
  label: string;
  name: string;
  options: CatalogFilterOption[];
  value?: string;
}

export function CatalogFilters({
  dictionary,
  clearHref,
  fields = [],
  query,
  level,
  resultCount,
}: {
  dictionary: Dictionary;
  clearHref: string;
  fields?: CatalogFilterField[];
  query?: string;
  level?: string;
  resultCount: number;
}) {
  const activeFilterCount = [
    query?.trim(),
    level,
    ...fields.map((field) => field.value),
  ].filter(Boolean).length;

  return (
    <details
      open={activeFilterCount > 0}
      className="group editorial-card overflow-hidden rounded-[2rem]"
    >
      <summary className="flex min-h-20 cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground bg-accent shadow-[2px_3px_0_var(--color-foreground)]">
          <SlidersHorizontal aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-black">{dictionary.catalog.filtersTitle}</span>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-black text-white">
                {activeFilterCount} {dictionary.catalog.activeFilters}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-foreground/60">
            {dictionary.catalog.filtersDescription}
          </span>
        </span>
        <span
          role="status"
          className="ml-auto hidden shrink-0 text-sm font-black text-primary-dark sm:block"
        >
          {resultCount} {dictionary.catalog.resultsLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t-2 border-foreground/15 bg-surface/75 px-5 py-5 sm:px-6">
        <form className="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm font-bold md:col-span-2">
            {dictionary.catalog.searchLabel}
            <span className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-foreground/50"
              />
              <input
                name="q"
                defaultValue={query}
                placeholder={dictionary.catalog.searchPlaceholder}
                className="h-12 w-full rounded-control border-2 border-foreground/45 bg-surface pl-10 pr-3 font-medium hover:border-primary focus:border-primary"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            {dictionary.catalog.levelLabel}
            <select
              name="level"
              defaultValue={level ?? ""}
              className="h-12 rounded-control border-2 border-foreground/45 bg-surface px-3 font-semibold hover:border-primary focus:border-primary"
            >
              <option value="">{dictionary.catalog.allLevels}</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </label>

          {fields.map((field) => (
            <label
              key={field.name}
              className="flex min-w-0 flex-col gap-1.5 text-sm font-bold"
            >
              {field.label}
              <select
                name={field.name}
                defaultValue={field.value ?? ""}
                className="h-12 min-w-0 rounded-control border-2 border-foreground/45 bg-surface px-3 font-semibold capitalize hover:border-primary focus:border-primary"
              >
                <option value="">{field.allLabel}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-control border-2 border-foreground bg-primary-dark px-5 font-black text-white shadow-[2px_3px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5"
            >
              {dictionary.catalog.filterButton}
            </button>
            <Link
              href={clearHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-sm font-black text-primary-dark hover:bg-surface-muted"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {dictionary.catalog.clearFilters}
            </Link>
            <span className="ml-auto text-sm font-black text-primary-dark sm:hidden">
              {resultCount} {dictionary.catalog.resultsLabel}
            </span>
          </div>
        </form>
      </div>
    </details>
  );
}
