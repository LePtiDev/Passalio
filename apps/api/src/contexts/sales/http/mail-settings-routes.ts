import { mailSettingsChange, type MailboxTestResponse } from "@passalio/shared";
import { Hono } from "hono";
import * as z from "zod";
import { validateJson, validateParam } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { getMailSettings } from "../application/get-mail-settings";
import { saveMailSettings } from "../application/save-mail-settings";
import { testMailbox } from "../application/test-mailbox";
import { createMailSettingsDependencies } from "../infrastructure/mail-settings-dependencies";
import { mailSettingsErrorResponse } from "./mail-settings-error-response";
import { serializeMailSettings } from "./mail-settings-serializer";

const memberParams = z.object({ userId: z.string().min(1).max(64) });

const dependencies = (context: { env: PlatformEnv["Bindings"]; var: PlatformEnv["Variables"] }) =>
  createMailSettingsDependencies({
    database: context.var.database,
    auditTrail: context.var.auditTrail,
    emailSender: context.var.emailSender,
    logger: context.var.logger,
    delivery: context.env.EMAIL_DELIVERY,
    secretKey: context.env.MAIL_SECRET_KEY,
    appUrl: context.env.APP_URL,
  });

export const mailSettingsRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/:userId", validateParam(memberParams), async (context) => {
    const result = await getMailSettings(dependencies(context))(
      context.var.platformActor,
      context.req.valid("param").userId,
    );
    return result.isOk
      ? context.json(serializeMailSettings(result.value))
      : mailSettingsErrorResponse(context, result.error);
  })
  .put(
    "/:userId",
    validateParam(memberParams),
    validateJson(mailSettingsChange),
    async (context) => {
      const result = await saveMailSettings(dependencies(context))(
        context.var.platformActor,
        context.req.valid("param").userId,
        context.req.valid("json"),
      );
      return result.isOk
        ? context.body(null, 204)
        : mailSettingsErrorResponse(context, result.error);
    },
  )
  .post("/:userId/test", validateParam(memberParams), async (context) => {
    const result = await testMailbox(dependencies(context))(
      context.var.platformActor,
      context.req.valid("param").userId,
    );
    if (!result.isOk) {
      return mailSettingsErrorResponse(context, result.error);
    }
    const tested: MailboxTestResponse = {
      sentTo: result.value.sentTo,
      verifiedAt: result.value.verifiedAt.toISOString(),
    };
    return context.json(tested);
  });
