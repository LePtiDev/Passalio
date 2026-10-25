import type { LocalDatabase } from "@/lib/db/local-database";
import type { InterventionRecord } from "@/lib/db/local-records";

const isAssignedTo = (intervention: InterventionRecord, userId: string) =>
  intervention.technicianUserIds.length === 0
    ? intervention.technicianUserId === userId
    : intervention.technicianUserIds.includes(userId);

const timeOf = (intervention: InterventionRecord) => intervention.startTime ?? "99:99";

export const nextVisitAfter = async (
  database: LocalDatabase,
  current: InterventionRecord,
  userId: string,
) => {
  const sameDay = await database.interventions
    .where("scheduledDate")
    .equals(current.scheduledDate)
    .toArray();
  const [next] = sameDay
    .filter(
      (intervention) =>
        intervention.id !== current.id &&
        intervention.status === "planned" &&
        intervention.deletedAt === null &&
        isAssignedTo(intervention, userId) &&
        timeOf(intervention) >= timeOf(current),
    )
    .toSorted((first, second) => timeOf(first).localeCompare(timeOf(second)));
  if (next === undefined) {
    return null;
  }
  const [customer, site] = await Promise.all([
    database.customers.get(next.customerId),
    database.sites.get(next.siteId),
  ]);
  return customer === undefined || site === undefined
    ? null
    : { intervention: next, customer, site };
};
