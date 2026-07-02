"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/core/models";
import { setLocaleAction } from "./actions";
import { cn } from "@/shared/lib/cn";

const OPTIONS: Locale[] = ["es", "en"];

export function LanguageSwitcher({
  locale,
  theme = "light",
  compact = false,
}: {
  locale: Locale;
  theme?: "light" | "dark";
  compact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full border p-1 text-sm",
      theme === "dark" ? "border-white/20 bg-black/10" : "border-border",
    )}>
      {OPTIONS.map((option) => (
        <form key={option} action={setLocaleAction.bind(null, option, pathname)}>
          <button
            type="submit"
            aria-pressed={locale === option}
            aria-label={option === "es" ? "Español" : "English"}
            className={cn(
              "rounded-full font-bold uppercase transition-colors",
              compact ? "grid h-9 min-w-9 place-items-center px-1 text-xs" : "px-2.5 py-1",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark",
              locale === option
                ? theme === "dark"
                  ? "bg-accent text-foreground"
                  : "bg-primary-dark text-white"
                : theme === "dark"
                  ? "text-white/65 hover:bg-white/10"
                  : "text-foreground/70 hover:bg-surface",
            )}
          >
            {option}
          </button>
        </form>
      ))}
    </div>
  );
}
