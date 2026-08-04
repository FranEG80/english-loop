import "server-only";
import type { AuthPort } from "@/core/ports";
import type {
  AuthSession,
  ChangePasswordInput,
  Credentials,
  RegisterInput,
  UpdateProfileInput,
} from "@/core/models";
import { DEFAULT_CEFR_LEVEL } from "@/core/models/level";

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  isDemo?: boolean | null;
}

interface BetterAuthSessionResponse {
  user?: BetterAuthUser;
}

async function requestHeaders() {
  const { headers } = await import("next/headers");
  return headers();
}

async function getAuthClient() {
  const { nextAuth } = await import("@/server/infrastructure/auth/next-auth");
  return nextAuth;
}

function toAuthSession(response: BetterAuthSessionResponse | null): AuthSession | null {
  if (!response?.user) return null;
  return {
    userId: response.user.id,
    name: response.user.name,
    email: response.user.email,
    isDemo: Boolean(response.user.isDemo),
    activeLevels: [DEFAULT_CEFR_LEVEL],
  };
}

function requireAuthSession(response: BetterAuthSessionResponse): AuthSession {
  const session = toAuthSession(response);
  if (!session) throw new Error("No se pudo establecer la sesión.");
  return session;
}

/**
 * Adaptador server-side del puerto de autenticación.
 *
 * Las Server Actions llaman a `auth.api` directamente para que Better Auth
 * pueda escribir la cookie en la respuesta de Next.js mediante `nextCookies`.
 * El navegador usa el Route Handler REST; ninguna Server Action hace un fetch
 * HTTP interno para crear la sesión.
 */
export const authServerAdapter: AuthPort = {
  async getSession() {
    const auth = await getAuthClient();
    return toAuthSession(
      await auth.api.getSession({ headers: await requestHeaders() }),
    );
  },

  async login(credentials: Credentials) {
    const auth = await getAuthClient();
    return requireAuthSession(
      await auth.api.signInEmail({
        body: credentials,
        headers: await requestHeaders(),
      }),
    );
  },

  async register(input: RegisterInput) {
    const auth = await getAuthClient();
    return requireAuthSession(
      await auth.api.signUpEmail({
        body: input,
        headers: await requestHeaders(),
      }),
    );
  },

  async updateProfile(input: UpdateProfileInput) {
    const auth = await getAuthClient();
    await auth.api.updateUser({
      body: input,
      headers: await requestHeaders(),
    });
  },

  async changePassword(input: ChangePasswordInput) {
    const auth = await getAuthClient();
    await auth.api.changePassword({
      body: {
        ...input,
        revokeOtherSessions: input.revokeOtherSessions ?? true,
      },
      headers: await requestHeaders(),
    });
  },

  async logout() {
    const auth = await getAuthClient();
    await auth.api.signOut({ headers: await requestHeaders() });
  },
};
