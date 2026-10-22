import { describe, expect, it } from "vitest";
import { gettingStartedTasks } from "./getting-started-tasks";

describe("gettingStartedTasks", () => {
  it("asks to invite the team until someone is invited or has joined", () => {
    const alone = gettingStartedTasks({ isCompanyReady: true, invitedOrJoinedCount: 0 });
    expect(alone.map(({ status }) => status)).toEqual([
      "done",
      "todo",
      "soon",
      "soon",
      "soon",
      "soon",
    ]);
    expect(alone[1]?.action?.to).toBe("/equipe");

    const withTeam = gettingStartedTasks({ isCompanyReady: true, invitedOrJoinedCount: 2 });
    expect(withTeam[1]).toMatchObject({ status: "done", action: null });
  });
});
