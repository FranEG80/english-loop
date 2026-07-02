import type { AuthSession, Credentials, RegisterInput } from "../models/auth";

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  login(credentials: Credentials): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
}
