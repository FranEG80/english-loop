import { NextResponse } from "next/server";
import { z } from "zod";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import {
  activityResponseSchema,
  parseRequest,
} from "@/server/infrastructure/http/request-schemas";
import { checkActivityAnswer } from "@/core/practice/application/use-cases/check-activity-answer";

const checkBodySchema = z.object({ response: activityResponseSchema }).strict();

/**
 * Corrige una respuesta de la previsualización del catálogo.
 *
 * No registra intento, no toca el repaso espaciado y no cuenta como práctica:
 * entrar en una actividad para probarla tiene que decir si está bien y por
 * qué, pero no puede contaminar el progreso del alumno.
 */
export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ activityId: string }> }) => {
    const { activityId } = await context.params;
    const actor = await compositionRoot.identity.getActor();
    const body = parseRequest(checkBodySchema.safeParse(await request.json()));

    const feedback = await checkActivityAnswer(compositionRoot.getActivityCatalog(actor), {
      activityId,
      response: body.response,
    });

    return NextResponse.json(feedback);
  },
);
