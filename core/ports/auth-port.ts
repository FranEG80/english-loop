import type { AuthSession, Credentials, RegisterInput } from "../models/types/auth";

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  login(credentials: Credentials): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
}
