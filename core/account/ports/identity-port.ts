import type { CefrLevel } from "@/core/models/level";

/** Actor autenticado dentro del core. Nunca expone tipos de Better Auth. */
export interface Actor {
  userId: string;
  name: string;
  email: string;
  activeLevels: CefrLevel[];
}

/** Puerta de entrada a la identidad del usuario autenticado. */
export interface IdentityPort {
  /** Devuelve el actor autenticado o `null` si no hay sesión. */
  getActor(): Promise<Actor | null>;
  /** Lanza UnauthorizedException si no hay sesión. */
  requireActor(): Promise<Actor>;
}
