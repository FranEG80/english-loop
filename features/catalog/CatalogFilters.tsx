import Link from "next/link";
import type { Dictionary } from "@/shared/i18n";

export function CatalogFilters({
  dictionary,
  clearHref,
  query,
  level,
}: {
  dictionary: Dictionary;
  clearHref: string;
  query?: string;
  level?: string;
}) {
  return (
    <form className="editorial-card grid gap-3 rounded-[2rem] p-5 sm:grid-cols-[1fr_auto_auto_auto]">
      <label className="flex flex-col gap-1 text-sm font-medium">
        {dictionary.catalog.searchLabel}
        <input
          name="q"
          defaultValue={query}
          placeholder={dictionary.catalog.searchPlaceholder}
          className="h-12 rounded-control border-2 border-foreground/50 bg-surface px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {dictionary.catalog.levelLabel}
        <select
          name="level"
          defaultValue={level ?? ""}
          className="h-12 rounded-control border-2 border-foreground/50 bg-surface px-3"
        >
          <option value="">{dictionary.catalog.allLevels}</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
        </select>
      </label>
      <button
        type="submit"
        className="h-12 self-end rounded-control border-2 border-foreground bg-primary-dark px-4 font-black text-white shadow-[2px_3px_0_var(--color-foreground)]"
      >
        {dictionary.catalog.filterButton}
      </button>
      <Link
        href={clearHref}
        className="inline-flex h-12 items-center self-end px-2 text-sm font-medium text-primary-dark"
      >
        {dictionary.catalog.clearFilters}
      </Link>
    </form>
  );
}
