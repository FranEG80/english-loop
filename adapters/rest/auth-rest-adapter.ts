import type { AuthPort } from "@/core/ports";
import type { AuthSession, Credentials, RegisterInput } from "@/core/models";
import { restRequest } from "./http-client";

export const authRestAdapter: AuthPort = {
  getSession: () => restRequest<AuthSession | null>("/auth/session"),
  login: (credentials: Credentials) =>
    restRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  register: (input: RegisterInput) =>
    restRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () => restRequest<void>("/auth/logout", { method: "POST" }),
};
