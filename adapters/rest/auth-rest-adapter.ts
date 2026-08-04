import type { AuthPort } from "@/core/ports";
import type {
  AuthSession,
  ChangePasswordInput,
  Credentials,
  RegisterInput,
  UpdateProfileInput,
} from "@/core/models";
import { DEFAULT_CEFR_LEVEL } from "@/core/models/level";
import { restFetch, RestApiError } from "./http-client";

const AUTH_BASE_PATH = "/api/auth";

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await restFetch(`${AUTH_BASE_PATH}${path}`, {
    ...init,
    credentials: "include",
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
  return { userId: response.user.id, name: response.user.name, email: response.user.email, activeLevels: [DEFAULT_CEFR_LEVEL] };
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
  updateProfile: (input: UpdateProfileInput) =>
    authRequest<void>("/update-user", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  changePassword: (input: ChangePasswordInput) =>
    authRequest<void>("/change-password", {
      method: "POST",
      body: JSON.stringify({ ...input, revokeOtherSessions: input.revokeOtherSessions ?? true }),
    }),
  logout: () => authRequest<void>("/sign-out", { method: "POST" }),
};
