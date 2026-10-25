import { describe, expect, it } from "vitest";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { createOrganization } from "./create-organization";

const jean = { userId: "user-jean", email: "jean@example.fr", isImpersonating: false };

describe("createOrganization while sign-up is closed", () => {
  it("refuses a new company and creates nothing", async () => {
    const state = { ...createInMemoryIdentityState(), signUp: { isOpen: false } };
    const result = await createOrganization(createInMemoryIdentityDependencies(state))(jean, {
      name: "Ramonage Dupont",
    });
    expect(result).toEqual({ isOk: false, error: "sign_up_closed" });
    expect(state.organizations).toEqual([]);
    expect(state.members).toEqual([]);
    expect(state.auditEntries).toEqual([]);
  });

  it("creates the company once sign-up is open again", async () => {
    const state = { ...createInMemoryIdentityState(), signUp: { isOpen: true } };
    const result = await createOrganization(createInMemoryIdentityDependencies(state))(jean, {
      name: "Ramonage Dupont",
    });
    expect(result.isOk).toBe(true);
    expect(state.organizations).toHaveLength(1);
  });
});
