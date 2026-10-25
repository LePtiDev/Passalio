import type { CallSeriesTarget } from "@passalio/shared";
import type {
  CallRow,
  LastCall,
  ProspectCall,
  ProspectFollowUp,
  ProspectTask,
  Qualification,
  SeriesRow,
  TaskRow,
} from "./call-models";
import type { NameCursor } from "./prospect-ports";

export type SeriesRequest = {
  readonly department: string | undefined;
  readonly target: CallSeriesTarget;
  readonly after: NameCursor | undefined;
  readonly limit: number;
};

export type CallRepository = {
  readonly record: (
    call: ProspectCall,
    lastCall: LastCall,
    task: ProspectTask | null,
  ) => Promise<void>;
  readonly ofCompany: (companyId: string, limit: number) => Promise<readonly CallRow[]>;
  readonly countByAuthorSince: (authorUserId: string, since: Date) => Promise<number>;
  readonly series: (request: SeriesRequest) => Promise<readonly SeriesRow[]>;
};

export type FollowUpRepository = {
  readonly findByCompany: (companyId: string) => Promise<ProspectFollowUp | undefined>;
  readonly qualify: (
    companyId: string,
    qualification: { readonly [Key in keyof Qualification]?: Qualification[Key] | undefined },
    at: Date,
  ) => Promise<void>;
};

export type TaskChanges = {
  readonly [
    Key in keyof Pick<
      ProspectTask,
      "status" | "dueAt" | "notify" | "notifyAt" | "notifiedAt" | "updatedAt"
    >
  ]?: ProspectTask[Key] | undefined;
};

export type TaskRepository = {
  readonly findById: (taskId: string) => Promise<ProspectTask | undefined>;
  readonly update: (taskId: string, changes: TaskChanges) => Promise<void>;
  readonly openOfCompany: (companyId: string) => Promise<readonly TaskRow[]>;
  readonly openOfOwnerDueBefore: (
    ownerUserId: string,
    before: Date,
    limit: number,
  ) => Promise<readonly TaskRow[]>;
  readonly createFromWebsite: (task: ProspectTask) => Promise<void>;
};
