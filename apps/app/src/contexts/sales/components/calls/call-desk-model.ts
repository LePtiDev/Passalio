import {
  parisDay,
  parisInstant,
  shiftParisDay,
  type InterestLevel,
  type ProspectCompanyFileResponse,
  type ProspectContactResponse,
  type ProspectFollowUpResponse,
  type ProspectQualificationResponse,
} from "@passalio/shared";
import { callablePhoneOf } from "../file/company-facts";

export const QUALIFICATION_KEYS = [
  "interest",
  "teamSize",
  "toolKind",
  "certificateVolume",
  "decisionMaker",
] as const;

export type QualificationKey = (typeof QUALIFICATION_KEYS)[number];

export type DeskContact = {
  readonly contact: ProspectContactResponse | null;
  readonly phone: string | null;
};

export const deskContactOf = (
  file: Pick<ProspectCompanyFileResponse, "company" | "contacts">,
  contactId: string | null,
): DeskContact => {
  const contact =
    file.contacts.find(({ id }) => id === contactId) ??
    file.contacts.find(({ isMain }) => isMain) ??
    file.contacts[0] ??
    null;
  return {
    contact,
    phone: contact?.mobile ?? contact?.phone ?? callablePhoneOf(file),
  };
};

export const taskToCloseOf = (
  followUp: Pick<ProspectFollowUpResponse, "tasks">,
  taskId: string | null,
  now: Date,
): string | null => {
  if (taskId !== null) {
    return taskId;
  }
  const endOfToday = parisInstant(shiftParisDay(parisDay(now), 1), "00:00");
  const due = followUp.tasks
    .filter((task) => task.kind === "callback" && task.status === "open")
    .filter((task) => new Date(task.dueAt) < endOfToday)
    .toSorted((first, second) => first.dueAt.localeCompare(second.dueAt));
  return due[0]?.id ?? null;
};

export type QualificationAnswers = Omit<ProspectQualificationResponse, "interest"> & {
  readonly interest: InterestLevel | null;
};

export const answeredCountOf = (answers: QualificationAnswers) =>
  QUALIFICATION_KEYS.filter((key) => answers[key] !== null).length;

export const nextQuestionOf = (answers: QualificationAnswers): QualificationKey | null =>
  QUALIFICATION_KEYS.find((key) => answers[key] === null) ?? null;
