import type {
  AuthSession,
  ChangePasswordInput,
  Credentials,
  RegisterInput,
  UpdateProfileInput,
} from "../models/types/auth";

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  login(credentials: Credentials): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  updateProfile(input: UpdateProfileInput): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  logout(): Promise<void>;
}
