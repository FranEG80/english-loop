import type { ReactNode } from "react";
import { getLocalePort } from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { WorkspaceShell } from "@/shared/layout/WorkspaceShell";
import { requireSession } from "@/shared/lib/require-session";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [session, locale] = await Promise.all([
    requireSession(),
    getLocalePort().getLocale(),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <WorkspaceShell dictionary={dictionary} locale={locale} session={session}>
      {children}
    </WorkspaceShell>
  );
}
