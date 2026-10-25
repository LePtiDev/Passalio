import { documentNumberLabel, parisDay } from "@passalio/shared";
import { formatCalendarDate } from "@/contexts/customers";
import type { DocumentRecord } from "@/lib/db/local-records";

const PARIS_CLOCK = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

export const signedAtLabel = (signedAt: string) => {
  const at = new Date(signedAt);
  return `${formatCalendarDate(parisDay(at))} à ${PARIS_CLOCK.format(at)}`;
};

export const numberOf = (document: Pick<DocumentRecord, "numberPrefix" | "number">) =>
  documentNumberLabel(document.numberPrefix, document.number);
