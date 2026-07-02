import type { AuthPort } from "@/core/ports";
import { mockAuthUser, mockValidCredentials } from "./data/auth";
import {
  clearAuthCookie,
  readAuthCookie,
  writeAuthCookie,
} from "@/adapters/browser/auth-cookie-server";

export const authMockAdapter: AuthPort = {
  async getSession() {
    const userId = await readAuthCookie();
    if (!userId || userId !== mockAuthUser.userId) return null;
    return mockAuthUser;
  },

  async login(credentials) {
    const isValid =
      credentials.email === mockValidCredentials.email &&
      credentials.password === mockValidCredentials.password;
    if (!isValid) {
      throw new Error("Email o contraseña incorrectos.");
    }
    await writeAuthCookie(mockAuthUser.userId);
    return mockAuthUser;
  },

  async register(input) {
    // El registro mock siempre da de alta al mismo usuario de demostración.
    await writeAuthCookie(mockAuthUser.userId);
    return { ...mockAuthUser, name: input.name, email: input.email };
  },

  async logout() {
    await clearAuthCookie();
  },
};
