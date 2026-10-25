import {
  CALL_OUTCOMES,
  INTEREST_LEVELS,
  NEXT_ACTIONS,
  NOTIFY_MODES,
  PROSPECT_NOTE_MAX_LENGTH,
  type InterestLevel,
  type NextAction,
  type ProspectCallLog,
} from "@passalio/shared";
import * as z from "zod";
import { dueAtOf } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";

const text = callsFr.session;

const DEFAULT_TIME = "09:00";

const unchosen = z.literal("");

export const isScheduled = (action: NextAction | "") => action === "demo" || action === "callback";

export const callFormSchema = z
  .object({
    outcome: z.union([z.enum(CALL_OUTCOMES), unchosen]),
    interest: z.union([z.enum(INTEREST_LEVELS), unchosen]),
    nextAction: z.union([z.enum(NEXT_ACTIONS), unchosen]),
    date: z.string(),
    time: z.string(),
    notify: z.enum(NOTIFY_MODES),
    notes: z.string().trim().max(PROSPECT_NOTE_MAX_LENGTH),
  })
  .superRefine((values, context) => {
    if (values.outcome === "") {
      context.addIssue({ code: "custom", path: ["outcome"], message: text.required });
    }
    if (values.outcome === "answered" && values.interest === "") {
      context.addIssue({ code: "custom", path: ["interest"], message: text.required });
    }
    if (values.outcome === "answered" && values.nextAction === "") {
      context.addIssue({ code: "custom", path: ["nextAction"], message: text.required });
    }
    if (isScheduled(values.nextAction) && values.date === "") {
      context.addIssue({ code: "custom", path: ["date"], message: text.dateRequired });
    }
    if (isScheduled(values.nextAction) && values.time === "") {
      context.addIssue({ code: "custom", path: ["time"], message: text.dateRequired });
    }
  });

export type CallFormValues = z.infer<typeof callFormSchema>;

export const emptyCallForm = (
  tomorrow: string,
  interest: InterestLevel | null = null,
): CallFormValues => ({
  outcome: "",
  interest: interest ?? "",
  nextAction: "",
  date: tomorrow,
  time: DEFAULT_TIME,
  notify: "minutes_15",
  notes: "",
});

export const toCallLog = (values: CallFormValues, contactId: string | null): ProspectCallLog => {
  const nextAction = values.nextAction === "" ? null : values.nextAction;
  return {
    contactId,
    outcome: values.outcome === "" ? "no_answer" : values.outcome,
    nextAction,
    schedule: isScheduled(values.nextAction)
      ? { dueAt: dueAtOf(values.date, values.time), notify: values.notify }
      : null,
    notes: values.notes === "" ? null : values.notes,
  };
};
