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
  constructor(private readonly authClient: typeof auth = auth) {}

  async getActor(): Promise<Actor | null> {
    const session = await this.authClient.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return null;
    const user = session.user as typeof session.user & { isDemo?: boolean | null };

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      isDemo: Boolean(user.isDemo),
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
