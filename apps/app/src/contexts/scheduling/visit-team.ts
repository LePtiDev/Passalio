import type { InterventionRecord } from "@/lib/db/local-records";

type Assignment = Pick<InterventionRecord, "technicianUserId" | "technicianUserIds">;

export const assignedTechniciansOf = ({ technicianUserId, technicianUserIds }: Assignment) =>
  technicianUserIds.length === 0 ? [technicianUserId] : technicianUserIds;

export const isAssignedTo = (intervention: Assignment, userId: string) =>
  assignedTechniciansOf(intervention).includes(userId);
