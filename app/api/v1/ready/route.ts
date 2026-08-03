import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";

/** Ready: comprueba BD, auth y catálogo. */
export const GET = async () => {
  const checks: Record<string, boolean> = {};

  checks.database = await compositionRoot.checkDatabase();

  checks.catalog = await compositionRoot.checkCatalog();

  checks.auth = compositionRoot.checkAuth();

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json(
    { ready, checks },
    { status: ready ? 200 : 503 },
  );
};
