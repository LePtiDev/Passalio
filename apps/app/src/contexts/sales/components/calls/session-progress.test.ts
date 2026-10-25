import { describe, expect, it } from "vitest";
import { nextProgress, startProgress, type SessionStep } from "./session-progress";

const run = (total: number, steps: readonly SessionStep[]) =>
  steps.reduce(nextProgress, startProgress(total));

describe("call session progress", () => {
  it("starts on the first call, or finished when there is nobody to call", () => {
    expect(startProgress(3)).toEqual({
      total: 3,
      index: 0,
      answered: 0,
      voicemail: 0,
      logged: 0,
      isFinished: false,
    });
    expect(startProgress(0).isFinished).toBe(true);
  });

  it("counts the people reached and the voicemails, and moves to the next call", () => {
    expect(
      run(4, [
        { type: "logged", outcome: "answered" },
        { type: "logged", outcome: "voicemail" },
        { type: "logged", outcome: "no_answer" },
      ]),
    ).toEqual({ total: 4, index: 3, answered: 1, voicemail: 1, logged: 3, isFinished: false });
  });

  it("moves on without counting a skipped call", () => {
    expect(run(3, [{ type: "skipped" }])).toMatchObject({ index: 1, logged: 0 });
  });

  it("finishes after the last call, logged or skipped", () => {
    expect(run(2, [{ type: "skipped" }, { type: "logged", outcome: "answered" }])).toMatchObject({
      index: 1,
      logged: 1,
      isFinished: true,
    });
    expect(run(1, [{ type: "skipped" }]).isFinished).toBe(true);
  });

  it("finishes early on request and ignores anything after", () => {
    const finished = run(5, [{ type: "logged", outcome: "answered" }, { type: "finished" }]);
    expect(finished).toMatchObject({ index: 1, logged: 1, isFinished: true });
    expect(nextProgress(finished, { type: "logged", outcome: "answered" })).toBe(finished);
  });
});
