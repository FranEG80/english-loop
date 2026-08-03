import "server-only";
import { headers } from "next/headers";
import { auth } from "@/server/infrastructure/auth/auth";
import type { Actor, IdentityPort } from "@/core/account/ports/identity-port";
import { DEFAULT_CEFR_LEVEL } from "@/core/models/level";
import { UnauthorizedException } from "@/core/shared/exceptions";

/**
 * Adaptador de identidad sobre Better Auth. Traduce la sesión externa a un
 * `Actor` del core. Los tipos de Better Auth no salen de este adaptador.
 */
export class BetterAuthIdentityAdapter implements IdentityPort {
  async getActor(): Promise<Actor | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;

    return {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      activeLevels: [DEFAULT_CEFR_LEVEL],
    };
  }

  async requireActor(): Promise<Actor> {
    const actor = await this.getActor();
    if (!actor) {
      throw new UnauthorizedException(
        "Authentication required",
        "You must be signed in to perform this action.",
      );
    }
    return actor;
  }
}
