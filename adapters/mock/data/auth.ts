import type { AuthSession } from "@/core/models";

export const mockAuthUser: AuthSession = {
  userId: "user-mock-1",
  name: "Alex",
  email: "alex@example.com",
  activeLevels: ["B1", "B2"],
};

/** Credenciales válidas para el login mock. */
export const mockValidCredentials = {
  email: "alex@example.com",
  password: "password123",
};
