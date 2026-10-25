import { describe, expect, it, vi } from "vitest";

vi.mock("./backoffice-api", () => ({ backofficeApi: {} }));

const { canManageSettings } = await import("./admin-access");
const { JOURNAL_ACTIONS } = await import("./journal-fr");

describe("canManageSettings", () => {
  it("opens the settings to the superadmin only", () => {
    expect(canManageSettings("superadmin")).toBe(true);
    expect(canManageSettings("admin")).toBe(false);
    expect(canManageSettings("sales")).toBe(false);
  });
});

describe("sign-up journal labels", () => {
  it("says in French who closed or opened sign-up", () => {
    expect(JOURNAL_ACTIONS["platform.sign_up_closed"]?.({}, "")).toBe("a fermé les inscriptions");
    expect(JOURNAL_ACTIONS["platform.sign_up_opened"]?.({}, "")).toBe("a ouvert les inscriptions");
  });
});
