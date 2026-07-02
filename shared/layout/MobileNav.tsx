"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSPACE_NAV_ITEMS } from "./nav-items";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";

export function MobileNav({ dictionary }: { dictionary: Dictionary }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={dictionary.nav.home}
      className="fixed inset-x-1 bottom-1 z-40 flex rounded-2xl border-2 border-foreground bg-primary-dark p-1 shadow-[3px_4px_0_var(--color-foreground)] min-[430px]:inset-x-2 min-[430px]:bottom-2 min-[430px]:p-1.5 lg:hidden"
    >
      {WORKSPACE_NAV_ITEMS.map(({ href, labelKey, Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[0.65rem] font-bold transition-colors",
              isActive ? "bg-accent text-foreground" : "text-white/65",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-[429px]:sr-only">{dictionary.nav[labelKey]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
