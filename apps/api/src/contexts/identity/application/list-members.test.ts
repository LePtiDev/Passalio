import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { listMembers, MEMBERS_PAGE_SIZE } from "./list-members";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => listMembers(createInMemoryIdentityDependencies(state, () => NOW));
const technician = organizationActorWith("technician");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("listMembers", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s see the team", async (role) => {
    expect((await run()(organizationActorWith(role), {})).members).toHaveLength(4);
  });

  it("stays readable during an impersonation", async () => {
    const page = await run()(organizationActorWith("owner", { isImpersonating: true }), {});
    expect(page.members).toHaveLength(4);
  });

  it("lists only the members of the actor's organization with their name and email", async () => {
    const page = await run()(technician, {});
    expect(page.members.map(({ organizationId }) => organizationId)).toEqual([
      "organization-a",
      "organization-a",
      "organization-a",
      "organization-a",
    ]);
    expect(page.members.find(({ role }) => role === "owner")).toMatchObject({
      userId: "user-owner",
      name: "Name owner",
      email: "owner@example.fr",
    });
    expect(page.nextCursor).toBeNull();
  });

  it("cuts the list to 50 members by default", async () => {
    expect(MEMBERS_PAGE_SIZE).toBe(50);
    Array.from({ length: MEMBERS_PAGE_SIZE }, (_, index) => {
      const userId = `user-extra-${String(index).padStart(2, "0")}`;
      state.users.push({ id: userId, name: userId, email: `${userId}@example.fr` });
      state.members.push({
        id: `member-extra-${String(index).padStart(2, "0")}`,
        organizationId: "organization-a",
        userId,
        role: "technician",
      });
    });
    const page = await run()(technician, {});
    expect(page.members).toHaveLength(50);
    expect(page.nextCursor).toBe(page.members.at(-1)?.id);
  });

  it("walks through the team page by page", async () => {
    const first = await run()(technician, { limit: 3 });
    const second = await run()(technician, { limit: 3, afterId: first.nextCursor ?? "" });
    expect(first.members).toHaveLength(3);
    expect(second.members).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.members, ...second.members].map(({ id }) => id)).size).toBe(4);
  });
});
