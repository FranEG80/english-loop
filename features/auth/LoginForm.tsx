"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button, Input } from "@/shared/ui";
import type { Dictionary } from "@/shared/i18n";

export function LoginForm({ dictionary }: { dictionary: Dictionary }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Input
        id="email"
        name="email"
        type="email"
        label={dictionary.auth.emailLabel}
        autoComplete="email"
        defaultValue="alex@example.com"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={dictionary.auth.passwordLabel}
        autoComplete="current-password"
        required
      />
      {state?.error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? dictionary.common.loading : dictionary.auth.submitLogin}
      </Button>
      <p className="text-sm text-foreground/70">{dictionary.auth.demoHint}</p>
    </form>
  );
}
