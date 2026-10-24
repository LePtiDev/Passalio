import type {
  CallOutcome,
  CertificateVolume,
  DecisionMaker,
  InterestLevel,
  NextAction,
  NotifyMode,
  ProspectStage,
  ProspectTaskStatus,
  ProspectTeamSize,
  ScheduledNextAction,
  ToolKind,
} from "@passalio/shared";
import type { Person, ProspectCompany } from "./prospect-models";

export type ProspectCall = {
  readonly id: string;
  readonly companyId: string;
  readonly contactId: string | null;
  readonly authorUserId: string | null;
  readonly outcome: CallOutcome;
  readonly nextAction: NextAction | null;
  readonly notes: string | null;
  readonly calledAt: Date;
};

export type Qualification = {
  readonly interest: InterestLevel | null;
  readonly teamSize: ProspectTeamSize | null;
  readonly toolKind: ToolKind | null;
  readonly certificateVolume: CertificateVolume | null;
  readonly decisionMaker: DecisionMaker | null;
};

export type LastCall = {
  readonly companyId: string;
  readonly lastCallAt: Date;
  readonly lastCallOutcome: CallOutcome;
  readonly lastCallByUserId: string | null;
};

export type ProspectFollowUp = Qualification & {
  readonly companyId: string;
  readonly lastCallAt: Date | null;
  readonly lastCallOutcome: CallOutcome | null;
  readonly lastCallByUserId: string | null;
  readonly updatedAt: Date;
};

export type ProspectTask = {
  readonly id: string;
  readonly companyId: string;
  readonly contactId: string | null;
  readonly ownerUserId: string | null;
  readonly kind: ScheduledNextAction;
  readonly dueAt: Date;
  readonly notify: NotifyMode;
  readonly notifyAt: Date | null;
  readonly notifiedAt: Date | null;
  readonly status: ProspectTaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CallRow = ProspectCall & {
  readonly author: Person | null;
  readonly contact: Person | null;
};

export type TaskRow = ProspectTask & {
  readonly owner: Person | null;
  readonly contact: Person | null;
  readonly company: Pick<ProspectCompany, "id" | "name" | "city" | "phone">;
};

export type SeriesRow = {
  readonly id: string;
  readonly name: string;
  readonly searchName: string;
  readonly city: string | null;
  readonly department: string;
  readonly phone: string;
  readonly stage: ProspectStage;
  readonly mainContact: Person | null;
  readonly lastCallAt: Date | null;
  readonly lastCallOutcome: CallOutcome | null;
  readonly interest: InterestLevel | null;
};
