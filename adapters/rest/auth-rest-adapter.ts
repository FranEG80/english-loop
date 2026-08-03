import type { AuthPort } from "@/core/ports";
import type { AuthSession, Credentials, RegisterInput } from "@/core/models";
import { RestApiError } from "./http-client";

const AUTH_BASE_PATH = "/api/auth";

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AUTH_BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new RestApiError(`Auth request failed: ${response.status}`, response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

interface BetterAuthSessionResponse {
  user?: { id: string; name: string; email: string };
}

function toAuthSession(response: BetterAuthSessionResponse | null): AuthSession | null {
  if (!response?.user) return null;
  return { userId: response.user.id, name: response.user.name, email: response.user.email, activeLevels: ["B1"] };
}

export const authRestAdapter: AuthPort = {
  getSession: async () => toAuthSession(await authRequest<BetterAuthSessionResponse | null>("/get-session")),
  login: (credentials: Credentials) =>
    authRequest<BetterAuthSessionResponse>("/sign-in/email", {
      method: "POST",
      body: JSON.stringify(credentials),
    }).then((response) => toAuthSession(response) as AuthSession),
  register: (input: RegisterInput) =>
    authRequest<BetterAuthSessionResponse>("/sign-up/email", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((response) => toAuthSession(response) as AuthSession),
  logout: () => authRequest<void>("/sign-out", { method: "POST" }),
};
