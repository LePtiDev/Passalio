import { CALL_OUTCOMES, NEXT_ACTIONS, PROSPECT_STAGES } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { notifyAtOf, stageAfterCall, startOfNextParisDay, startOfParisDay } from "./call-rules";

describe("stageAfterCall", () => {
  it.each(PROSPECT_STAGES.filter((stage) => stage !== "customer"))(
    "plans a demo from %s",
    (stage) => {
      expect(stageAfterCall(stage, "answered", "demo")).toBe("demo_planned");
    },
  );

  it.each(PROSPECT_STAGES.filter((stage) => stage !== "customer"))(
    "closes %s as not interested",
    (stage) => {
      expect(stageAfterCall(stage, "answered", "not_interested")).toBe("not_interested");
    },
  );

  it("qualifies a company to qualify once someone answered", () => {
    expect(stageAfterCall("to_qualify", "answered", null)).toBe("qualified");
    expect(stageAfterCall("to_qualify", "answered", "callback")).toBe("qualified");
    expect(stageAfterCall("to_qualify", "answered", "email")).toBe("qualified");
  });

  it.each(CALL_OUTCOMES.filter((outcome) => outcome !== "answered"))(
    "keeps a company to qualify when the call ends with %s",
    (outcome) => {
      expect(stageAfterCall("to_qualify", outcome, "callback")).toBe("to_qualify");
    },
  );

  it("keeps a later stage on a plain answered call", () => {
    expect(stageAfterCall("interested", "answered", "callback")).toBe("interested");
    expect(stageAfterCall("qualified", "answered", null)).toBe("qualified");
  });

  it.each(
    CALL_OUTCOMES.flatMap((outcome) =>
      [null, ...NEXT_ACTIONS].map((action) => [outcome, action] as const),
    ),
  )("never moves a customer (%s, %s)", (outcome, action) => {
    expect(stageAfterCall("customer", outcome, action)).toBe("customer");
  });
});

describe("notifyAtOf", () => {
  const dueAt = new Date("2026-10-27T09:30:00Z");

  it("notifies fifteen minutes before", () => {
    expect(notifyAtOf(dueAt, "minutes_15")).toEqual(new Date("2026-10-27T09:15:00Z"));
  });

  it("notifies at the time of the callback", () => {
    expect(notifyAtOf(dueAt, "at_time")).toEqual(dueAt);
  });

  it("notifies the day before at 18 h Paris time, in winter and in summer", () => {
    expect(notifyAtOf(dueAt, "day_before")).toEqual(new Date("2026-10-26T17:00:00Z"));
    expect(notifyAtOf(new Date("2026-06-10T07:00:00Z"), "day_before")).toEqual(
      new Date("2026-06-09T16:00:00Z"),
    );
  });

  it("uses the Paris day of a callback just after midnight", () => {
    expect(notifyAtOf(new Date("2026-10-26T23:30:00Z"), "day_before")).toEqual(
      new Date("2026-10-26T17:00:00Z"),
    );
  });

  it("notifies the day before across the change to summer time", () => {
    expect(notifyAtOf(new Date("2026-03-30T07:00:00Z"), "day_before")).toEqual(
      new Date("2026-03-29T16:00:00Z"),
    );
  });

  it("does not notify when asked not to", () => {
    expect(notifyAtOf(dueAt, "none")).toBeNull();
  });
});

describe("Paris day bounds", () => {
  it("starts the Paris day at midnight Paris time", () => {
    expect(startOfParisDay(new Date("2026-10-24T21:59:00Z"))).toEqual(
      new Date("2026-10-23T22:00:00Z"),
    );
    expect(startOfParisDay(new Date("2026-10-24T22:01:00Z"))).toEqual(
      new Date("2026-10-24T22:00:00Z"),
    );
  });

  it("ends the Paris day at the next midnight, a 25 hour day included", () => {
    expect(startOfNextParisDay(new Date("2026-10-25T10:00:00Z"))).toEqual(
      new Date("2026-10-25T23:00:00Z"),
    );
  });
});
