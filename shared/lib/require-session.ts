import "server-only";
import { redirect } from "next/navigation";
import { getAuthPort } from "@/adapters/adapter-factory";
import type { AuthSession } from "@/core/models";

/**
 * Helper de Server Component/Server Action para las rutas del Workspace
 * Shell: si no hay sesión mock, redirige a `/login` antes de renderizar.
 */
export async function requireSession(redirectTo = "/login"): Promise<AuthSession> {
  const session = await getAuthPort().getSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}
