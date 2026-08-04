import type { AuthPort } from "@/core/ports";
import { mockAuthUser, mockValidCredentials } from "./data/auth";
import {
  clearAuthCookie,
  readAuthCookie,
  writeAuthCookie,
} from "@/adapters/browser/auth-cookie-server";

let currentMockUser = mockAuthUser;
let currentMockPassword = mockValidCredentials.password;

export const authMockAdapter: AuthPort = {
  async getSession() {
    const userId = await readAuthCookie();
    if (!userId || userId !== mockAuthUser.userId) return null;
    return currentMockUser;
  },

  async login(credentials) {
    const isValid =
      credentials.email === currentMockUser.email &&
      credentials.password === currentMockPassword;
    if (!isValid) {
      throw new Error("Email o contraseña incorrectos.");
    }
    await writeAuthCookie(mockAuthUser.userId);
    return currentMockUser;
  },

  async register(input) {
    // El registro mock siempre da de alta al mismo usuario de demostración.
    currentMockUser = { ...mockAuthUser, name: input.name, email: input.email };
    currentMockPassword = input.password;
    await writeAuthCookie(mockAuthUser.userId);
    return currentMockUser;
  },

  async updateProfile(input) {
    currentMockUser = { ...currentMockUser, name: input.name };
  },

  async changePassword(input) {
    if (input.currentPassword !== currentMockPassword) {
      throw new Error("La contraseña actual no es correcta.");
    }
    currentMockPassword = input.newPassword;
  },

  async logout() {
    await clearAuthCookie();
    currentMockUser = mockAuthUser;
    currentMockPassword = mockValidCredentials.password;
  },
};
