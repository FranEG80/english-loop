"use server";

import { redirect } from "next/navigation";
import { getAuthPort } from "@/adapters/adapter-factory";

export interface AuthActionState {
  error?: string;
}

export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await getAuthPort().login({ email, password });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo iniciar sesión.",
    };
  }

  redirect("/");
}

export async function registerAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await getAuthPort().register({ name, email, password });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear la cuenta.",
    };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await getAuthPort().logout();
  redirect("/");
}
