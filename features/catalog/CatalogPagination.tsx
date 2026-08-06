import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Dictionary } from "@/shared/i18n";

function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  else search.delete("page");
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

type PageItem = number | "ellipsis";

function visiblePages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const validPages = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((left, right) => left - right);
  const items: PageItem[] = [];
  for (const current of validPages) {
    const previous = items.at(-1);
    if (typeof previous === "number" && current - previous > 1) {
      items.push("ellipsis");
    }
    items.push(current);
  }
  return items;
}

export function CatalogPagination({
  basePath,
  dictionary,
  page,
  placement,
  params,
  totalItems,
  totalPages,
}: {
  basePath: string;
  dictionary: Dictionary;
  page: number;
  placement: "top" | "bottom";
  params: Record<string, string | undefined>;
  totalItems: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const linkClass = "inline-flex size-11 items-center justify-center rounded-control border-2 border-foreground bg-surface font-black shadow-[2px_3px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5";
  const disabledClass = "inline-flex size-11 items-center justify-center rounded-control border-2 border-foreground/20 bg-foreground/5 text-foreground/35";
  return (
    <nav
      aria-label={
        placement === "top"
          ? dictionary.catalog.paginationTop
          : dictionary.catalog.paginationBottom
      }
      className="flex flex-wrap items-center justify-between gap-4 rounded-card border-2 border-foreground bg-surface px-4 py-3 shadow-[3px_4px_0_color-mix(in_srgb,var(--color-foreground)_18%,transparent)]"
    >
      <p className="min-w-max font-bold text-foreground/65">
        <span className="font-black text-foreground">{totalItems}</span>{" "}
        {dictionary.catalog.resultsLabel}
        <span className="mx-2 text-foreground/25" aria-hidden="true">·</span>
        {dictionary.catalog.pageLabel} {page} {dictionary.catalog.ofLabel}{" "}
        {totalPages}
      </p>
      <div className="flex items-center gap-2">
      {page > 1 ? (
        <Link
          rel="prev"
          href={pageHref(basePath, params, page - 1)}
          className={linkClass}
          aria-label={dictionary.common.previous}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="sr-only">{dictionary.common.previous}</span>
        </span>
      )}
      <div className="hidden items-center gap-2 sm:flex">
        {visiblePages(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-8 items-center justify-center font-black text-foreground/40"
              aria-hidden="true"
            >
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex size-11 items-center justify-center rounded-control border-2 border-primary-dark bg-primary-dark font-black text-white"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={pageHref(basePath, params, item)}
              className={linkClass}
              aria-label={`${dictionary.catalog.pageLabel} ${item}`}
            >
              {item}
            </Link>
          ),
        )}
      </div>
      {page < totalPages ? (
        <Link
          rel="next"
          href={pageHref(basePath, params, page + 1)}
          className={linkClass}
          aria-label={dictionary.common.next}
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ArrowRight aria-hidden="true" className="size-4" />
          <span className="sr-only">{dictionary.common.next}</span>
        </span>
      )}
      </div>
    </nav>
  );
}
