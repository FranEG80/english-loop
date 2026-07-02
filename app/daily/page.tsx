import { redirect } from "next/navigation";
import { getDailySessionPort } from "@/adapters/adapter-factory";
import { requireSession } from "@/shared/lib/require-session";

const TIMEZONE = "UTC";

export default async function DailyPage() {
  await requireSession();
  const dailySession = await getDailySessionPort().getTodaySession(TIMEZONE);

  if (dailySession.status === "completed") {
    redirect("/daily/summary");
  }
  if (dailySession.status === "practice") {
    redirect("/daily/practice");
  }
  redirect("/daily/lesson");
}
