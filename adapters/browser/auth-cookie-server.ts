import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./cookie-names";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Lee el ID de usuario mock guardado en la cookie de sesión (o `null`). */
export async function readAuthCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/** Solo se puede invocar desde un Server Action o un Route Handler. */
export async function writeAuthCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}

/** Solo se puede invocar desde un Server Action o un Route Handler. */
export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}
