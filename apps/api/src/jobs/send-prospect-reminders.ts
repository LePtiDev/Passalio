import { createReminderDependencies, sendDueReminders } from "../contexts/sales";
import type { Bindings } from "../env";
import { createDatabase } from "../platform/database";
import { createEmailSender } from "../platform/email";
import { createLogger } from "../platform/logger";
import { newTraceId } from "../platform/trace";

export const sendProspectReminders = async (env: Bindings) => {
  const logger = createLogger(newTraceId());
  const emailSender = createEmailSender(
    {
      delivery: env.EMAIL_DELIVERY,
      resendApiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      assetsUrl: env.APP_URL,
    },
    logger,
  );
  const run = await sendDueReminders(
    createReminderDependencies({
      database: createDatabase(env.DB),
      emailSender,
      appUrl: env.APP_URL,
    }),
  )();
  const fields = {
    event: "prospect_reminders_run",
    sent: run.sentTaskIds.length,
    skipped: run.skipped,
    failedTaskIds: run.failedTaskIds,
  };
  if (run.failedTaskIds.length > 0) {
    logger.error(fields);
  } else {
    logger.info(fields);
  }
  return run;
};
