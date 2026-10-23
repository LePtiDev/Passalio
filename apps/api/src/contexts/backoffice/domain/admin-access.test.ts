import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MAX_AGE_MS,
  evaluateAdminAccess,
  type AdminSessionFacts,
} from "./admin-access";

const NOW = new Date("2026-10-23T10:00:00Z");

const facts = (overrides: Partial<AdminSessionFacts> = {}): AdminSessionFacts => ({
  userId: "user-1",
  email: "admin@passalio.com",
  name: "Quentin",
  role: "superadmin",
  isTwoFactorEnabled: true,
  isImpersonating: false,
  isBanned: false,
  signedInAt: new Date(NOW.getTime() - 60_000),
  ...overrides,
});

describe("evaluateAdminAccess", () => {
  it("lets a superadmin with two-factor and a recent sign-in in", () => {
    expect(evaluateAdminAccess(facts(), NOW)).toEqual({
      isOk: true,
      value: { userId: "user-1", email: "admin@passalio.com", name: "Quentin", role: "superadmin" },
    });
  });

  it("lets a support member in", () => {
    const result = evaluateAdminAccess(facts({ role: "support" }), NOW);
    expect(result.isOk && result.value.role).toBe("support");
  });

  it.each<[string, Partial<AdminSessionFacts>]>([
    ["a regular user", { role: "user" }],
    ["a user without role", { role: null }],
    ["an impersonated session", { isImpersonating: true }],
    ["a banned admin", { isBanned: true }],
  ])("hides the admin space from %s", (_, overrides) => {
    expect(evaluateAdminAccess(facts(overrides), NOW)).toEqual({ isOk: false, error: "not_admin" });
  });

  it("asks an admin without two-factor to enable it", () => {
    expect(evaluateAdminAccess(facts({ isTwoFactorEnabled: false }), NOW)).toEqual({
      isOk: false,
      error: "two_factor_required",
    });
  });

  it("asks to sign in again after twelve hours", () => {
    const signedInAt = new Date(NOW.getTime() - ADMIN_SESSION_MAX_AGE_MS - 1);
    expect(evaluateAdminAccess(facts({ signedInAt }), NOW)).toEqual({
      isOk: false,
      error: "admin_session_expired",
    });
  });
});
