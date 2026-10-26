import { describe, expect, it } from "vitest";
import { evaluateAdminAccess, type AdminSessionFacts } from "./admin-access";

const NOW = new Date("2026-10-26T10:00:00Z");
const WITHOUT_TWO_FACTOR = { isTwoFactorRequired: false };

const facts = (overrides: Partial<AdminSessionFacts> = {}): AdminSessionFacts => ({
  userId: "user-1",
  email: "admin@passalio.com",
  name: "Quentin",
  role: "superadmin",
  isTwoFactorEnabled: false,
  isImpersonating: false,
  isBanned: false,
  twoFactorVerifiedAt: null,
  ...overrides,
});

describe("evaluateAdminAccess when two-factor is not required", () => {
  it("lets an admin in without two-factor", () => {
    expect(evaluateAdminAccess(facts(), NOW, WITHOUT_TWO_FACTOR)).toEqual({
      isOk: true,
      value: { userId: "user-1", email: "admin@passalio.com", name: "Quentin", role: "superadmin" },
    });
  });

  it("lets an admin in when two-factor is enabled but the session never passed the code", () => {
    const result = evaluateAdminAccess(
      facts({ isTwoFactorEnabled: true }),
      NOW,
      WITHOUT_TWO_FACTOR,
    );
    expect(result.isOk).toBe(true);
  });

  it("lets a sales member in without two-factor", () => {
    const result = evaluateAdminAccess(facts({ role: "sales" }), NOW, WITHOUT_TWO_FACTOR);
    expect(result.isOk && result.value.role).toBe("sales");
  });

  it.each<[string, Partial<AdminSessionFacts>]>([
    ["a regular user", { role: "user" }],
    ["a user without role", { role: null }],
    ["an impersonated session", { isImpersonating: true }],
    ["a banned admin", { isBanned: true }],
  ])("still hides the admin space from %s", (_, overrides) => {
    expect(evaluateAdminAccess(facts(overrides), NOW, WITHOUT_TWO_FACTOR)).toEqual({
      isOk: false,
      error: "not_admin",
    });
  });
});
