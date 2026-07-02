"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";
import { Button, Input } from "@/shared/ui";
import type { Dictionary } from "@/shared/i18n";

export function RegisterForm({ dictionary }: { dictionary: Dictionary }) {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Input
        id="name"
        name="name"
        type="text"
        label={dictionary.auth.nameLabel}
        autoComplete="name"
        required
      />
      <Input
        id="email"
        name="email"
        type="email"
        label={dictionary.auth.emailLabel}
        autoComplete="email"
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        label={dictionary.auth.passwordLabel}
        autoComplete="new-password"
        required
      />
      {state?.error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? dictionary.common.loading : dictionary.auth.submitRegister}
      </Button>
    </form>
  );
}
