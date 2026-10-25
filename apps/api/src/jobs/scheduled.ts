import type { Bindings } from "../env";
import { sendProspectReminders } from "./send-prospect-reminders";

export const handleScheduled = async (
  _controller: ScheduledController,
  env: Bindings,
  executionContext: ExecutionContext,
): Promise<void> => {
  executionContext.waitUntil(sendProspectReminders(env));
};
