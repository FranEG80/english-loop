import { NextResponse } from "next/server";

/** Health: comprueba que el proceso está vivo. */
export const GET = async () => {
  return NextResponse.json({ status: "ok" });
};
