import { describe, expect, it } from "vitest";
import { followUp, prospectTask } from "@/test-support/call-records";
import { companyFile, prospectCompany, prospectContact } from "@/test-support/sales-records";
import {
  answeredCountOf,
  deskContactOf,
  nextQuestionOf,
  taskToCloseOf,
  type QualificationAnswers,
} from "./call-desk-model";

const NOW = new Date("2026-10-24T10:00:00Z");

const EMPTY: QualificationAnswers = {
  interest: null,
  teamSize: null,
  toolKind: null,
  certificateVolume: null,
  decisionMaker: null,
};

describe("deskContactOf", () => {
  const company = prospectCompany("company-1", "Ramonage Lefèvre");
  const boss = prospectContact("boss", company.id, "Lefèvre", { mobile: "06 11 11 11 11" });
  const helper = prospectContact("helper", company.id, "Roche", {
    isMain: false,
    phone: "01 22 22 22 22",
  });

  it("calls the expected contact on their mobile first", () => {
    expect(deskContactOf(companyFile(company, { contacts: [boss, helper] }), "helper")).toEqual({
      contact: helper,
      phone: "01 22 22 22 22",
    });
    expect(deskContactOf(companyFile(company, { contacts: [helper, boss] }), null)).toEqual({
      contact: boss,
      phone: "06 11 11 11 11",
    });
  });

  it("falls back to the company number when nobody is known", () => {
    expect(deskContactOf(companyFile(company), null)).toEqual({
      contact: null,
      phone: "01 45 67 89 10",
    });
  });
});

describe("taskToCloseOf", () => {
  it("closes the task the call was started from", () => {
    expect(taskToCloseOf(followUp(), "task-1", NOW)).toBe("task-1");
  });

  it("otherwise closes the earliest callback due by tonight, never a demo or a later callback", () => {
    const tasks = [
      prospectTask("tomorrow", { dueAt: "2026-10-25T08:00:00.000Z" }),
      prospectTask("tonight", { dueAt: "2026-10-24T20:00:00.000Z" }),
      prospectTask("late", { dueAt: "2026-10-23T08:00:00.000Z" }),
      prospectTask("demo", { kind: "demo", dueAt: "2026-10-22T08:00:00.000Z" }),
    ];
    expect(taskToCloseOf(followUp({ tasks }), null, NOW)).toBe("late");
    expect(taskToCloseOf(followUp({ tasks: tasks.slice(0, 1) }), null, NOW)).toBeNull();
  });
});

describe("qualification progress", () => {
  it("counts the answers and asks the first missing question", () => {
    expect(answeredCountOf(EMPTY)).toBe(0);
    expect(nextQuestionOf(EMPTY)).toBe("interest");
    const partial = { ...EMPTY, interest: "warm", teamSize: "solo" } as const;
    expect(answeredCountOf(partial)).toBe(2);
    expect(nextQuestionOf(partial)).toBe("toolKind");
    const full = {
      ...partial,
      toolKind: "paper",
      certificateVolume: "over_800",
      decisionMaker: "manager",
    } as const;
    expect(nextQuestionOf(full)).toBeNull();
    expect(answeredCountOf(full)).toBe(5);
  });
});
