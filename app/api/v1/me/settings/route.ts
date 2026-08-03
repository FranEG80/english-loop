import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getOrCreateUserSettings } from "@/core/account/application/use-cases/get-or-create-user-settings";
import { updateUserSettings } from "@/core/account/application/use-cases/update-user-settings";
import { toUserSettingsDto } from "@/core/account/application/mappers/user-settings-mapper";
import { parseRequest, settingsPatchSchema } from "@/server/infrastructure/http/request-schemas";

export const GET = withErrorHandling(async () => {
  const settings = await getOrCreateUserSettings(
    compositionRoot.identity,
    compositionRoot.userSettingsRepository,
  );
  return NextResponse.json(toUserSettingsDto(settings));
});

export const PATCH = withErrorHandling(async (request: Request) => {
  const body = parseRequest(settingsPatchSchema.safeParse(await request.json()));
  const settings = await updateUserSettings(
    compositionRoot.identity,
    compositionRoot.userSettingsRepository,
    body,
  );
  return NextResponse.json(toUserSettingsDto(settings));
});
