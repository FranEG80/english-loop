import type { CefrLevel } from "./level";

export type UserId = string;

export interface AuthSession {
  userId: UserId;
  name: string;
  email: string;
  activeLevels: CefrLevel[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput extends Credentials {
  name: string;
}
