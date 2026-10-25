import type { Bindings } from "../env";
import { archiveSignedCertificatePdfs } from "./archive-certificate-pdfs";
import { sendProspectReminders } from "./send-prospect-reminders";

export const handleScheduled = async (
  _controller: ScheduledController,
  env: Bindings,
  executionContext: ExecutionContext,
): Promise<void> => {
  executionContext.waitUntil(sendProspectReminders(env));
  executionContext.waitUntil(archiveSignedCertificatePdfs(env));
};
