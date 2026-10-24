import {
  changeSignUpSettingsBody,
  type SignUpAvailabilityResponse,
  type SignUpSettingsResponse,
} from "@passalio/shared";
import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { validateJson } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { changeSignUpSettings } from "../application/change-sign-up-settings";
import { isSignUpOpen } from "../application/check-sign-up";
import { getSignUpSettings } from "../application/get-sign-up-settings";
import type { SignUpSettings } from "../domain/sign-up-settings";
import { createPlatformSettingsDependencies } from "../infrastructure/platform-settings-dependencies";

const dependencies = (variables: AppEnv["Variables"]) =>
  createPlatformSettingsDependencies({
    database: variables.database,
    auditTrail: variables.auditTrail,
  });

const signUpSettingsResponse = ({
  isSignUpOpen: isOpen,
  changedAt,
  changedByName,
}: SignUpSettings): SignUpSettingsResponse => ({
  isSignUpOpen: isOpen,
  changedAt: changedAt?.toISOString() ?? null,
  changedByName,
});

export const platformSettingsRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/sign-up", async (context) =>
    context.json({
      settings: signUpSettingsResponse(
        await getSignUpSettings(dependencies(context.var))(context.var.platformActor),
      ),
    }),
  )
  .put("/sign-up", validateJson(changeSignUpSettingsBody), async (context) =>
    context.json({
      settings: signUpSettingsResponse(
        await changeSignUpSettings(dependencies(context.var))(
          context.var.platformActor,
          context.req.valid("json"),
        ),
      ),
    }),
  );

export const signUpAvailabilityRoutes = new Hono<AppEnv>().get("/", async (context) => {
  const availability: SignUpAvailabilityResponse = {
    isSignUpOpen: await isSignUpOpen(dependencies(context.var))(),
  };
  return context.json(availability);
});
