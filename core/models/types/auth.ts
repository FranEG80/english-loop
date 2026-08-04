import type { CefrLevel } from "../level";

export type UserId = string;

export interface AuthSession {
  userId: UserId;
  name: string;
  email: string;
  isDemo: boolean;
  activeLevels: CefrLevel[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name: string;
}

export interface UpdateProfileInput {
  name: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}
