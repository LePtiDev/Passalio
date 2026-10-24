import type { ProspectCall, ProspectTask } from "../domain/call-models";

const CREATED_AT = new Date("2026-10-01T08:00:00Z");

export const inMemoryCall = (
  call: Pick<ProspectCall, "id" | "companyId" | "calledAt"> & Partial<ProspectCall>,
): ProspectCall => ({
  contactId: null,
  authorUserId: null,
  outcome: "answered",
  nextAction: null,
  notes: null,
  ...call,
});

export const inMemoryTask = (
  task: Pick<ProspectTask, "id" | "companyId" | "dueAt"> & Partial<ProspectTask>,
): ProspectTask => ({
  contactId: null,
  ownerUserId: null,
  kind: "callback",
  notify: "none",
  notifyAt: null,
  notifiedAt: null,
  status: "open",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...task,
});
