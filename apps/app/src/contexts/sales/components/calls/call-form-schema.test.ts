import { prospectCallLog } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { callsFr } from "../../fr-calls";
import { callFormSchema, emptyCallForm, toCallLog, type CallFormValues } from "./call-form-schema";

const TOMORROW = "2026-10-27";

const filled = (changes: Partial<CallFormValues>): CallFormValues => ({
  ...emptyCallForm(TOMORROW),
  ...changes,
});

const errorsOf = (values: CallFormValues) => {
  const result = callFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("call form", () => {
  it("starts with nothing chosen, tomorrow at 9 h and a notification 15 min before", () => {
    expect(emptyCallForm(TOMORROW)).toEqual({
      outcome: "",
      interest: "",
      nextAction: "",
      date: TOMORROW,
      time: "09:00",
      notify: "minutes_15",
      notes: "",
    });
  });

  it("asks for a result", () => {
    expect(errorsOf(emptyCallForm(TOMORROW))).toEqual({ outcome: callsFr.session.required });
  });

  it("starts with the interest already known for the company", () => {
    expect(emptyCallForm(TOMORROW, "warm").interest).toBe("warm");
  });

  it("asks for the interest and a next action once someone answered, and not otherwise", () => {
    expect(errorsOf(filled({ outcome: "answered" }))).toEqual({
      interest: callsFr.session.required,
      nextAction: callsFr.session.required,
    });
    expect(errorsOf(filled({ outcome: "voicemail" }))).toEqual({});
  });

  it("asks for a date and a time for a callback or a demo", () => {
    expect(
      errorsOf(
        filled({ outcome: "answered", interest: "hot", nextAction: "demo", date: "", time: "" }),
      ),
    ).toEqual({
      date: callsFr.session.dateRequired,
      time: callsFr.session.dateRequired,
    });
    expect(
      errorsOf(filled({ outcome: "answered", interest: "cold", nextAction: "email", date: "" })),
    ).toEqual({});
  });

  it("sends a callback with its Paris time and its notification, accepted by the server", () => {
    const call = toCallLog(
      callFormSchema.parse(
        filled({
          outcome: "answered",
          interest: "warm",
          nextAction: "callback",
          time: "14:30",
          notify: "day_before",
          notes: "  Rappeler après la tournée ",
        }),
      ),
      "contact-1",
    );
    expect(call).toEqual({
      contactId: "contact-1",
      outcome: "answered",
      nextAction: "callback",
      schedule: { dueAt: "2026-10-27T13:30:00.000Z", notify: "day_before" },
      notes: "Rappeler après la tournée",
    });
    expect(prospectCallLog.safeParse(call).success).toBe(true);
  });

  it("sends no date when nothing is planned, accepted by the server", () => {
    const call = toCallLog(callFormSchema.parse(filled({ outcome: "no_answer" })), null);
    expect(call).toEqual({
      contactId: null,
      outcome: "no_answer",
      nextAction: null,
      schedule: null,
      notes: null,
    });
    expect(prospectCallLog.safeParse(call).success).toBe(true);
  });
});
