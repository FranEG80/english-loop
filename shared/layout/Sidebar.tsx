"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WORKSPACE_NAV_ITEMS } from "./nav-items";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import Image from "next/image";
import type { AuthSession } from "@/core/models";
import { LogoutButton } from "./LogoutButton";

export function Sidebar({
  dictionary,
  session,
}: {
  dictionary: Dictionary;
  session: AuthSession;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 p-4 lg:block">
      <nav
        aria-label={dictionary.nav.home}
        className="flex h-full flex-col rounded-[2rem] border-2 border-foreground bg-primary-dark p-4 text-white shadow-[6px_8px_0_var(--color-foreground)]"
      >
        <Link href="/" className="mb-8 flex items-center gap-3 px-2 pt-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent">
            <Image
              src="/brand/englishloop-mark.webp"
              alt=""
              width={34}
              height={34}
            />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight">EnglishLoop</span>
            <span className="font-hand block text-lg leading-none text-accent">
              learn · practise · repeat
            </span>
          </span>
        </Link>
        <div className="flex flex-col gap-1.5">
          {WORKSPACE_NAV_ITEMS.map(({ href, labelKey, Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-[transform,background-color,color]",
              isActive
                ? "translate-x-1 bg-accent text-foreground"
                : "text-white/75 hover:translate-x-1 hover:bg-white/10 hover:text-white",
            )}
          >
            <span className={cn(
              "grid h-8 w-8 place-items-center rounded-lg",
              isActive ? "bg-white/65" : "bg-white/10",
            )}>
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            {dictionary.nav[labelKey]}
          </Link>
        );
          })}
        </div>
        <div
          className="mt-auto grid grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-center gap-2.5 overflow-hidden rounded-2xl border border-white/20 bg-white/8 p-2.5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent font-black text-foreground">
            {session.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{session.name}</p>
            <p className="truncate text-xs text-white/50">{session.email}</p>
          </div>
          <LogoutButton label={dictionary.nav.logout} theme="dark" compact />
        </div>
      </nav>
    </aside>
  );
}
