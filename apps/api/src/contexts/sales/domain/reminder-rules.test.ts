import { describe, expect, it } from "vitest";
import type { DueReminder } from "./reminder-models";
import { reminderDecisionOf } from "./reminder-rules";

const DUE_AT = new Date("2026-11-05T16:30:00.000Z");

const minutesAfterDue = (minutes: number) => new Date(DUE_AT.getTime() + minutes * 60_000);

const reminder = (overrides: Partial<DueReminder> = {}): DueReminder => ({
  taskId: "task-1",
  kind: "callback",
  notify: "minutes_15",
  dueAt: DUE_AT,
  company: { id: "company-1", name: "KH Ramonage", city: "Ivry-sur-Seine" },
  contactName: "Karim Haddad",
  phone: "06 12 34 56 78",
  lastNote: null,
  interest: null,
  teamSize: null,
  toolKind: null,
  recipient: "antho@passalio.fr",
  ...overrides,
});

describe("reminderDecisionOf", () => {
  it("sends a reminder before, at and up to an hour after the time", () => {
    for (const minutes of [-15, 0, 5, 60]) {
      expect(reminderDecisionOf(reminder(), minutesAfterDue(minutes))).toEqual({
        isSendable: true,
        reminder: reminder(),
      });
    }
  });

  it("drops a reminder more than an hour late, after a pause of the cron", () => {
    expect(reminderDecisionOf(reminder(), minutesAfterDue(61))).toEqual({
      isSendable: false,
      reason: "too_late",
    });
  });

  it("drops a reminder whose owner left the team", () => {
    expect(reminderDecisionOf(reminder({ recipient: null }), DUE_AT)).toEqual({
      isSendable: false,
      reason: "no_recipient",
    });
  });

  it("never sends when the salesperson asked for no notification", () => {
    expect(reminderDecisionOf(reminder({ notify: "none" }), DUE_AT)).toEqual({
      isSendable: false,
      reason: "no_notification",
    });
  });
});
