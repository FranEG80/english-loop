import Link from "next/link";
import type { Dictionary } from "@/shared/i18n";

export function PublicFooter({ dictionary }: { dictionary: Dictionary }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-2 border-foreground bg-primary-dark text-white">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 py-12 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-black text-white">{dictionary.app.name}</p>
        <nav className="flex gap-4">
          <Link href="/login" className="hover:text-foreground">
            {dictionary.nav.login}
          </Link>
          <Link href="/register" className="hover:text-foreground">
            {dictionary.nav.register}
          </Link>
        </nav>
        <p>
          © {year} {dictionary.app.name}. {dictionary.landing.footerRights}
        </p>
      </div>
    </footer>
  );
}
