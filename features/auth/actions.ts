"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthPort } from "@/adapters/adapter-factory";

export interface AuthActionState {
  error?: string;
  success?: string;
}

const MIN_DISPLAY_NAME_LENGTH = 2;

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

export async function updateProfileAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < MIN_DISPLAY_NAME_LENGTH) {
    return { error: "El nombre debe tener al menos 2 caracteres." };
  }

  try {
    await getAuthPort().updateProfile({ name });
    revalidatePath("/", "layout");
    return { success: "Perfil actualizado." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar el perfil.",
    };
  }
}

export async function changePasswordAction(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Indica la contraseña actual y la nueva contraseña." };
  }
  if (newPassword !== confirmation) {
    return { error: "La confirmación no coincide con la nueva contraseña." };
  }

  try {
    await getAuthPort().changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    return { success: "Contraseña actualizada." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo actualizar la contraseña.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await getAuthPort().logout();
  redirect("/");
}
