import "server-only";
import { nextCookies } from "better-auth/next-js";
import { createAuth, type AuthRuntimeOptions } from "./auth";

/**
 * Better Auth para Server Actions de Next.js.
 *
 * La integración `nextCookies` es deliberadamente específica de Next.js. No
 * se añade al cliente común de `auth.ts`, porque ese módulo también se usa al
 * construir el Worker de Cloudflare y no debe depender de `next/headers`.
 */
export function createNextAuth(options: AuthRuntimeOptions = {}) {
  return createAuth({
    ...options,
    plugins: [...(options.plugins ?? []), nextCookies()],
  });
}

export const nextAuth = createNextAuth();
