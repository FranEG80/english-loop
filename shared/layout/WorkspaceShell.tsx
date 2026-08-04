import type { ReactNode } from "react";
import type { AuthSession, Locale } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function WorkspaceShell({
  dictionary,
  session,
  children,
}: {
  dictionary: Dictionary;
  locale: Locale;
  session: AuthSession;
  children: ReactNode;
}) {
  return (
    <div className="workspace-canvas flex min-h-dvh flex-col lg:flex-row">
      <Sidebar dictionary={dictionary} session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          className="workspace-content flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10"
        >
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav dictionary={dictionary} />
    </div>
  );
}
