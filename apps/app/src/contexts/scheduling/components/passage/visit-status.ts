import type { InterventionRecord } from "@/lib/db/local-records";
import { minutesOf } from "../../planning-layout";

export type VisitStatus = "planned" | "now" | "completed" | "cancelled";

export const visitStatusOf = (
  intervention: Pick<
    InterventionRecord,
    "status" | "scheduledDate" | "startTime" | "durationMinutes"
  >,
  today: string,
  nowMinutes: number,
): VisitStatus => {
  if (intervention.status !== "planned") {
    return intervention.status;
  }
  if (intervention.scheduledDate !== today || intervention.startTime === null) {
    return "planned";
  }
  const start = minutesOf(intervention.startTime);
  return start <= nowMinutes && nowMinutes < start + intervention.durationMinutes
    ? "now"
    : "planned";
};
