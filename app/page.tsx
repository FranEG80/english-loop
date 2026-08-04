import { getAuthPort, getLocalePort } from "@/adapters/adapter-factory";
import { redirect } from "next/navigation";
import { getDictionary } from "@/shared/i18n";
import { PublicShell } from "@/shared/layout/PublicShell";
import { Landing } from "@/features/landing/Landing";

export default async function RootPage() {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const session = await getAuthPort().getSession();

  if (!session) {
    return (
      <PublicShell dictionary={dictionary} locale={locale}>
        <Landing dictionary={dictionary} locale={locale} />
      </PublicShell>
    );
  }

  redirect("/dashboard");
}
