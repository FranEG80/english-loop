import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getTaxonomyProgress } from "@/core/progress/application/use-cases/get-taxonomy-progress";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ nodeId: string }> }) => {
    const { nodeId } = await context.params;
    return NextResponse.json(
      await getTaxonomyProgress(
        compositionRoot.identity,
        compositionRoot.progressRepository,
        nodeId,
      ),
    );
  },
);
