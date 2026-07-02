import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthPort, getLocalePort } from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";
import { PublicShell } from "@/shared/layout/PublicShell";
import { Mascot } from "@/shared/layout/Mascot";
import { Card } from "@/shared/ui";
import { LoginForm } from "@/features/auth/LoginForm";
import Image from "next/image";

export default async function LoginPage() {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);
  const session = await getAuthPort().getSession();

  if (session) {
    redirect("/");
  }

  return (
    <PublicShell dictionary={dictionary} locale={locale}>
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-5 py-12 lg:grid-cols-[1fr_.85fr] lg:items-center lg:py-20">
        <div className="ink-card relative hidden min-h-[38rem] overflow-hidden rounded-[3rem] bg-primary-dark p-10 text-white lg:block">
          <p className="font-hand relative z-10 text-4xl font-bold text-accent">Welcome back!</p>
          <h2 className="relative z-10 mt-4 max-w-md text-6xl font-medium leading-[.9]">
            Pick up exactly where you left off.
          </h2>
          <Image
            src="/photos/landing/conversation-practice.webp"
            alt=""
            fill
            sizes="550px"
            className="mt-10 object-cover opacity-25 mix-blend-luminosity"
          />
          <div className="absolute bottom-5 right-5 z-10">
            <Mascot pose="wave" size={220} priority className="!rounded-none !bg-transparent" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <p className="font-hand text-3xl font-bold text-coral lg:hidden">Welcome back!</p>
          <Card className="w-full max-w-lg flex flex-col gap-2 p-7 sm:p-9">
          <h1 className="text-4xl font-medium text-foreground">
            {dictionary.auth.loginTitle}
          </h1>
          <p className="mb-4 text-sm text-foreground/70">
            {dictionary.auth.loginSubtitle}
          </p>
          <LoginForm dictionary={dictionary} />
          </Card>
        <p className="text-sm text-foreground/70">
          {dictionary.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-primary-dark hover:underline">
            {dictionary.nav.register}
          </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
