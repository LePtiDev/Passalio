import { ForbiddenError, ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryCustomerDependencies,
  createInMemoryCustomerState,
  type InMemoryCustomerState,
} from "../infrastructure/in-memory-customer-dependencies";
import { seedCustomerOf } from "../infrastructure/in-memory-customer-fixtures";
import { updateSite } from "./update-site";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryCustomerState;
const run = () => updateSite(createInMemoryCustomerDependencies(state, () => NOW));
const technician = organizationActorWith("technician");

beforeEach(() => {
  state = createInMemoryCustomerState();
  seedCustomerOf(state, "organization-a", "a");
  seedCustomerOf(state, "organization-b", "b");
});

describe("updateSite", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s update a site", async (role) => {
    expect(
      await run()(organizationActorWith(role), {
        siteId: "site-a",
        changes: { accessNotes: "Code 1234" },
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(state.sites[0]?.accessNotes).toBe("Code 1234");
  });

  it("keeps the fields left out and dates the change", async () => {
    await run()(technician, {
      siteId: "site-a",
      changes: { occupantName: "Mme Martin", city: "Vitry-sur-Seine" },
    });
    expect(state.sites[0]).toMatchObject({
      address: "12 rue Paul Bert",
      postalCode: "94200",
      city: "Vitry-sur-Seine",
      occupantName: "Mme Martin",
      updatedAt: NOW,
    });
  });

  it("refuses any change during an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        siteId: "site-a",
        changes: { accessNotes: "Code 1234" },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(state.sites[0]?.accessNotes).toBeNull();
  });

  it("does not reach a site of another organization", async () => {
    expect(
      await run()(technician, { siteId: "site-b", changes: { accessNotes: "Code 1234" } }),
    ).toEqual({ isOk: false, error: "site_not_found" });
    expect(state.sites[1]?.accessNotes).toBeNull();
  });

  it("answers not found for an unknown site", async () => {
    expect(
      await run()(technician, { siteId: "site-unknown", changes: { accessNotes: "Code 1234" } }),
    ).toEqual({ isOk: false, error: "site_not_found" });
  });

  it("answers not found for a site of an archived customer", async () => {
    state.archivedAt.set("site-a", NOW);
    expect(
      await run()(technician, { siteId: "site-a", changes: { accessNotes: "Code 1234" } }),
    ).toEqual({ isOk: false, error: "site_not_found" });
  });
});
