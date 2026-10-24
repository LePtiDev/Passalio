import * as z from "zod";
import {
  CALL_OUTCOMES,
  CERTIFICATE_VOLUMES,
  DECISION_MAKERS,
  INTEREST_LEVELS,
  NEXT_ACTIONS,
  NOTIFY_MODES,
  PROSPECT_TASK_STATUSES,
  SCHEDULED_NEXT_ACTIONS,
  PROSPECT_TEAM_SIZES,
  TOOL_KINDS,
} from "./prospect-calls";
import { PROSPECT_STAGES } from "./prospects";

const person = z.object({ id: z.string(), name: z.string() });
const outcome = z.enum(CALL_OUTCOMES);

export const prospectQualificationResponse = z.object({
  interest: z.enum(INTEREST_LEVELS).nullable(),
  teamSize: z.enum(PROSPECT_TEAM_SIZES).nullable(),
  toolKind: z.enum(TOOL_KINDS).nullable(),
  certificateVolume: z.enum(CERTIFICATE_VOLUMES).nullable(),
  decisionMaker: z.enum(DECISION_MAKERS).nullable(),
});

export type ProspectQualificationResponse = z.infer<typeof prospectQualificationResponse>;

export const prospectCallResponse = z.object({
  id: z.string(),
  contact: person.nullable(),
  author: person.nullable(),
  outcome,
  nextAction: z.enum(NEXT_ACTIONS).nullable(),
  notes: z.string().nullable(),
  calledAt: z.string(),
});

export type ProspectCallResponse = z.infer<typeof prospectCallResponse>;

export const prospectTaskResponse = z.object({
  id: z.string(),
  kind: z.enum(SCHEDULED_NEXT_ACTIONS),
  status: z.enum(PROSPECT_TASK_STATUSES),
  dueAt: z.string(),
  notify: z.enum(NOTIFY_MODES),
  notifyAt: z.string().nullable(),
  owner: person.nullable(),
  contact: person.nullable(),
  company: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string().nullable(),
    phone: z.string().nullable(),
  }),
});

export type ProspectTaskResponse = z.infer<typeof prospectTaskResponse>;

export const prospectFollowUpResponse = z.object({
  qualification: prospectQualificationResponse,
  lastCall: z.object({ at: z.string(), outcome, by: person.nullable() }).nullable(),
  calls: z.array(prospectCallResponse),
  tasks: z.array(prospectTaskResponse),
});

export type ProspectFollowUpResponse = z.infer<typeof prospectFollowUpResponse>;

export const prospectMyDayResponse = z.object({
  tasks: z.array(prospectTaskResponse),
  counts: z.object({ overdue: z.number(), today: z.number(), callsToday: z.number() }),
});

export type ProspectMyDayResponse = z.infer<typeof prospectMyDayResponse>;

export const prospectCallSeriesResponse = z.object({
  companies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      city: z.string().nullable(),
      department: z.string(),
      phone: z.string(),
      stage: z.enum(PROSPECT_STAGES),
      mainContact: person.nullable(),
      lastCallAt: z.string().nullable(),
      lastCallOutcome: outcome.nullable(),
      interest: z.enum(INTEREST_LEVELS).nullable(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

export type ProspectCallSeriesResponse = z.infer<typeof prospectCallSeriesResponse>;

export const prospectCallLoggedResponse = z.object({
  id: z.string(),
  taskId: z.string().nullable(),
  stage: z.enum(PROSPECT_STAGES),
});

export type ProspectCallLoggedResponse = z.infer<typeof prospectCallLoggedResponse>;
