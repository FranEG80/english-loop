import type { ReactNode } from "react";
import type { Locale } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export function PublicShell({
  dictionary,
  locale,
  children,
}: {
  dictionary: Dictionary;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div className="public-canvas flex min-h-dvh flex-col">
      <PublicHeader dictionary={dictionary} locale={locale} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter dictionary={dictionary} />
    </div>
  );
}
