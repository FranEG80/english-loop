"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/features/auth/actions";
import type { Locale } from "@/core/models";
import { Button, Input } from "@/shared/ui";

interface ProfileSecurityFormsProps {
  name: string;
  locale: Locale;
}

const copy = {
  es: {
    profileEyebrow: "Tu identidad",
    profileTitle: "Perfil",
    profileDescription: "Cambia el nombre que aparece en tu espacio de aprendizaje.",
    name: "Nombre visible",
    saveProfile: "Guardar perfil",
    saving: "Guardando…",
    securityEyebrow: "Mantén el control",
    securityTitle: "Seguridad",
    securityDescription: "Cambia tu contraseña y cierra las demás sesiones.",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmation: "Repite la nueva contraseña",
    changePassword: "Cambiar contraseña",
    changing: "Actualizando…",
    passwordHint: "La contraseña se valida también en el servidor.",
  },
  en: {
    profileEyebrow: "Your identity",
    profileTitle: "Profile",
    profileDescription: "Change the name shown in your learning space.",
    name: "Display name",
    saveProfile: "Save profile",
    saving: "Saving…",
    securityEyebrow: "Stay in control",
    securityTitle: "Security",
    securityDescription: "Change your password and close your other sessions.",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmation: "Repeat the new password",
    changePassword: "Change password",
    changing: "Updating…",
    passwordHint: "The password is also validated on the server.",
  },
} as const;

export function ProfileSecurityForms({ name, locale }: ProfileSecurityFormsProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, undefined);
  const labels = copy[locale];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="ink-card rounded-[2rem] bg-level-b1 p-6 sm:p-8">
        <div className="mb-6">
          <p className="font-hand text-2xl font-bold text-coral">{labels.profileEyebrow}</p>
          <h2 className="text-3xl font-semibold">{labels.profileTitle}</h2>
          <p className="mt-2 text-sm font-semibold text-foreground/60">{labels.profileDescription}</p>
        </div>
        <form action={profileAction} className="flex flex-col gap-4" noValidate>
          <Input
            id="profile-name"
            name="name"
            type="text"
            label={labels.name}
            autoComplete="name"
            defaultValue={name}
            required
          />
          {profileState?.error ? (
            <p role="alert" className="text-sm font-medium text-danger">{profileState.error}</p>
          ) : null}
          {profileState?.success ? (
            <p role="status" className="text-sm font-medium text-primary-dark">{profileState.success}</p>
          ) : null}
          <Button type="submit" disabled={profilePending}>
            {profilePending ? labels.saving : labels.saveProfile}
          </Button>
        </form>
      </section>

      <section className="ink-card rounded-[2rem] bg-accent p-6 sm:p-8">
        <div className="mb-6">
          <p className="font-hand text-2xl font-bold text-coral">{labels.securityEyebrow}</p>
          <h2 className="text-3xl font-semibold">{labels.securityTitle}</h2>
          <p className="mt-2 text-sm font-semibold text-foreground/60">{labels.securityDescription}</p>
        </div>
        <form action={passwordAction} className="flex flex-col gap-4" noValidate>
          <Input
            id="current-password"
            name="currentPassword"
            type="password"
            label={labels.currentPassword}
            autoComplete="current-password"
            required
          />
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            label={labels.newPassword}
            autoComplete="new-password"
            required
          />
          <Input
            id="password-confirmation"
            name="confirmation"
            type="password"
            label={labels.confirmation}
            autoComplete="new-password"
            required
          />
          <p className="text-xs font-semibold text-foreground/60">{labels.passwordHint}</p>
          {passwordState?.error ? (
            <p role="alert" className="text-sm font-medium text-danger">{passwordState.error}</p>
          ) : null}
          {passwordState?.success ? (
            <p role="status" className="text-sm font-medium text-primary-dark">{passwordState.success}</p>
          ) : null}
          <Button type="submit" variant="secondary" disabled={passwordPending}>
            {passwordPending ? labels.changing : labels.changePassword}
          </Button>
        </form>
      </section>
    </div>
  );
}
