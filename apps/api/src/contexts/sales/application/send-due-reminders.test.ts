import { err, ok } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import type { DueReminder, SendableReminder } from "../domain/reminder-models";
import type { ReminderDependencies } from "../domain/reminder-ports";
import { REMINDER_BATCH_SIZE, sendDueReminders } from "./send-due-reminders";

const NOW = new Date("2026-11-05T16:15:00.000Z");

const reminder = (taskId: string, overrides: Partial<DueReminder> = {}): DueReminder => ({
  taskId,
  kind: "callback",
  notify: "minutes_15",
  dueAt: new Date("2026-11-05T16:30:00.000Z"),
  company: { id: "company-1", name: "KH Ramonage", city: "Ivry-sur-Seine" },
  contactName: "Karim Haddad",
  phone: "06 12 34 56 78",
  lastNote: null,
  interest: "warm",
  teamSize: null,
  toolKind: null,
  recipient: "antho@passalio.fr",
  ...overrides,
});

const fakeDependencies = (due: readonly DueReminder[], failingTaskIds: readonly string[] = []) => {
  const sent: SendableReminder[] = [];
  const notified: { taskId: string; at: Date }[] = [];
  const asked: { at: Date; limit: number }[] = [];
  const dependencies: ReminderDependencies = {
    reminders: {
      due: async (at, limit) => {
        asked.push({ at, limit });
        return due;
      },
      markNotified: async (taskId, at) => {
        notified.push({ taskId, at });
      },
    },
    mailer: {
      send: async (sendable) => {
        if (failingTaskIds.includes(sendable.taskId)) {
          return err("delivery_failed");
        }
        sent.push(sendable);
        return ok(undefined);
      },
    },
    now: () => NOW,
  };
  return { dependencies, sent, notified, asked };
};

describe("sendDueReminders", () => {
  it("asks for the reminders due now, by batch", async () => {
    const { dependencies, asked } = fakeDependencies([]);

    expect(await sendDueReminders(dependencies)()).toEqual({
      sentTaskIds: [],
      skipped: [],
      failedTaskIds: [],
    });
    expect(asked).toEqual([{ at: NOW, limit: REMINDER_BATCH_SIZE }]);
  });

  it("mails each due reminder to its recipient and marks it notified", async () => {
    const { dependencies, sent, notified } = fakeDependencies([
      reminder("task-1"),
      reminder("task-2", { recipient: "rappels@passalio.fr", kind: "demo" }),
    ]);

    const run = await sendDueReminders(dependencies)();

    expect(run.sentTaskIds).toEqual(["task-1", "task-2"]);
    expect(sent.map(({ recipient, kind }) => ({ recipient, kind }))).toEqual([
      { recipient: "antho@passalio.fr", kind: "callback" },
      { recipient: "rappels@passalio.fr", kind: "demo" },
    ]);
    expect(notified).toEqual([
      { taskId: "task-1", at: NOW },
      { taskId: "task-2", at: NOW },
    ]);
  });

  it("marks skipped reminders notified so they never come back", async () => {
    const { dependencies, sent, notified } = fakeDependencies([
      reminder("no-owner", { recipient: null }),
      reminder("too-late", { dueAt: new Date("2026-11-05T15:00:00.000Z") }),
    ]);

    const run = await sendDueReminders(dependencies)();

    expect(sent).toEqual([]);
    expect(run.skipped).toEqual([
      { taskId: "no-owner", reason: "no_recipient" },
      { taskId: "too-late", reason: "too_late" },
    ]);
    expect(notified.map(({ taskId }) => taskId)).toEqual(["no-owner", "too-late"]);
  });

  it("keeps a reminder that could not be mailed for the next run, and sends the others", async () => {
    const { dependencies, notified } = fakeDependencies(
      [reminder("refused"), reminder("task-2")],
      ["refused"],
    );

    const run = await sendDueReminders(dependencies)();

    expect(run.failedTaskIds).toEqual(["refused"]);
    expect(run.sentTaskIds).toEqual(["task-2"]);
    expect(notified.map(({ taskId }) => taskId)).toEqual(["task-2"]);
  });
});
