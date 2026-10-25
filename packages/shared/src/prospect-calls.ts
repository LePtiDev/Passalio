import * as z from "zod";
import { PROSPECT_NOTE_MAX_LENGTH } from "./prospects";

export const CALL_OUTCOMES = ["answered", "no_answer", "voicemail", "wrong_number"] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const NEXT_ACTIONS = ["demo", "callback", "email", "not_interested"] as const;

export type NextAction = (typeof NEXT_ACTIONS)[number];

export const SCHEDULED_NEXT_ACTIONS = ["demo", "callback"] as const;

export type ScheduledNextAction = (typeof SCHEDULED_NEXT_ACTIONS)[number];

export const NOTIFY_MODES = ["minutes_15", "day_before", "at_time", "none"] as const;

export type NotifyMode = (typeof NOTIFY_MODES)[number];

export const PROSPECT_TASK_STATUSES = ["open", "done", "cancelled"] as const;

export const PROSPECT_TASK_SOURCES = ["website"] as const;

export type ProspectTaskSource = (typeof PROSPECT_TASK_SOURCES)[number];

export type ProspectTaskStatus = (typeof PROSPECT_TASK_STATUSES)[number];

export const INTEREST_LEVELS = ["hot", "warm", "cold"] as const;

export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const PROSPECT_TEAM_SIZES = ["solo", "two_to_three", "four_plus"] as const;

export type ProspectTeamSize = (typeof PROSPECT_TEAM_SIZES)[number];

export const TOOL_KINDS = ["paper", "spreadsheet", "software"] as const;

export type ToolKind = (typeof TOOL_KINDS)[number];

export const CERTIFICATE_VOLUMES = ["under_300", "from_300_to_800", "over_800"] as const;

export type CertificateVolume = (typeof CERTIFICATE_VOLUMES)[number];

export const DECISION_MAKERS = ["manager", "partner", "other"] as const;

export type DecisionMaker = (typeof DECISION_MAKERS)[number];

export const CALL_SERIES_TARGETS = ["never_called", "not_reached"] as const;

export type CallSeriesTarget = (typeof CALL_SERIES_TARGETS)[number];

const isScheduled = (action: NextAction | null | undefined) =>
  action === "demo" || action === "callback";

export const prospectSchedule = z.object({
  dueAt: z.iso.datetime({ offset: true }),
  notify: z.enum(NOTIFY_MODES),
});

export type ProspectSchedule = z.infer<typeof prospectSchedule>;

export const prospectCallLog = z
  .object({
    contactId: z.string().min(1).nullable().optional(),
    outcome: z.enum(CALL_OUTCOMES),
    nextAction: z.enum(NEXT_ACTIONS).nullable().optional(),
    schedule: prospectSchedule.nullable().optional(),
    notes: z.string().trim().min(1).max(PROSPECT_NOTE_MAX_LENGTH).nullable().optional(),
  })
  .refine(
    (call) =>
      isScheduled(call.nextAction) === (call.schedule !== undefined && call.schedule !== null),
    {
      path: ["schedule"],
    },
  );

export type ProspectCallLog = z.infer<typeof prospectCallLog>;

export const prospectQualification = z
  .object({
    interest: z.enum(INTEREST_LEVELS).nullable().optional(),
    teamSize: z.enum(PROSPECT_TEAM_SIZES).nullable().optional(),
    toolKind: z.enum(TOOL_KINDS).nullable().optional(),
    certificateVolume: z.enum(CERTIFICATE_VOLUMES).nullable().optional(),
    decisionMaker: z.enum(DECISION_MAKERS).nullable().optional(),
  })
  .refine((qualification) => Object.keys(qualification).length > 0);

export type ProspectQualification = z.infer<typeof prospectQualification>;

export const prospectTaskChange = z
  .object({
    status: z.enum(PROSPECT_TASK_STATUSES).optional(),
    schedule: prospectSchedule.optional(),
  })
  .refine((change) => change.status !== undefined || change.schedule !== undefined);

export type ProspectTaskChange = z.infer<typeof prospectTaskChange>;
