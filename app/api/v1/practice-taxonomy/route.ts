import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getTaxonomyTree } from "@/core/content/application/use-cases/get-taxonomy";
import { toTaxonomyNodeDto } from "@/core/content/application/mappers/taxonomy-mapper";

export const GET = withErrorHandling(async () => {
  const actor = await compositionRoot.identity.getActor();
  const tree = await getTaxonomyTree(compositionRoot.getTaxonomyCatalog(actor));
  return NextResponse.json(tree.map(toTaxonomyNodeDto));
});
