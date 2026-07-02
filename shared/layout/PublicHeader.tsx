import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function PublicHeader({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between rounded-2xl border border-foreground/20 bg-surface/90 px-3 shadow-[0_16px_40px_-28px_rgba(18,42,47,.7)] backdrop-blur-xl sm:px-5">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/englishloop-mark.webp"
            alt=""
            width={38}
            height={38}
            className="h-9 w-9 rounded-xl bg-accent p-1"
            priority
          />
          <span className="text-lg font-black tracking-tight text-primary-dark">{dictionary.app.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link
            href="/login"
            className="hidden text-sm font-bold text-foreground/70 hover:text-foreground sm:inline"
          >
            {dictionary.nav.login}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-foreground bg-accent px-4 text-sm font-black text-foreground shadow-[2px_3px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5"
          >
            {dictionary.nav.register}
          </Link>
        </div>
      </div>
    </header>
  );
}
