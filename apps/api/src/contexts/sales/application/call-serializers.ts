import type {
  ProspectCallResponse,
  ProspectQualificationResponse,
  ProspectTaskResponse,
} from "@passalio/shared";
import type { CallRow, ProspectFollowUp, TaskRow } from "../domain/call-models";

export const qualificationResponse = (
  followUp: ProspectFollowUp | undefined,
): ProspectQualificationResponse => ({
  interest: followUp?.interest ?? null,
  teamSize: followUp?.teamSize ?? null,
  toolKind: followUp?.toolKind ?? null,
  certificateVolume: followUp?.certificateVolume ?? null,
  decisionMaker: followUp?.decisionMaker ?? null,
});

export const callResponse = (call: CallRow): ProspectCallResponse => ({
  id: call.id,
  contact: call.contact,
  author: call.author,
  outcome: call.outcome,
  nextAction: call.nextAction,
  notes: call.notes,
  calledAt: call.calledAt.toISOString(),
});

export const taskResponse = (task: TaskRow): ProspectTaskResponse => ({
  id: task.id,
  kind: task.kind,
  status: task.status,
  dueAt: task.dueAt.toISOString(),
  notify: task.notify,
  notifyAt: task.notifyAt?.toISOString() ?? null,
  owner: task.owner,
  contact: task.contact,
  company: task.company,
});
