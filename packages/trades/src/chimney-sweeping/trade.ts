import { defineTrade } from "../define-trade";
import { addMonths } from "./due-date";
import { CERTIFICATE_TEMPLATE_VERSION, chimneySweepingCertificate } from "./certificate";

export const CHIMNEY_SWEEPING_PERIODICITY_MONTHS = 12;

export const chimneySweepingTrade = defineTrade({
  id: "chimney_sweeping",
  label: "Ramonage",
  periodicityInMonths: CHIMNEY_SWEEPING_PERIODICITY_MONTHS,
  documentVersion: CERTIFICATE_TEMPLATE_VERSION,
  fields: chimneySweepingCertificate,
});

export const nextSweepingDueDate = (completedOn: string): string =>
  addMonths(completedOn, CHIMNEY_SWEEPING_PERIODICITY_MONTHS);

export const sweepingDatesAfter = (lastSweepingOn: string | null, completedOn: string) => {
  const latest =
    lastSweepingOn !== null && lastSweepingOn > completedOn ? lastSweepingOn : completedOn;
  return { lastSweepingOn: latest, nextDueDate: nextSweepingDueDate(latest) };
};
