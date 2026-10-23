import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import {
  inMemoryInvitation,
  seedOrganizationOf,
} from "../infrastructure/in-memory-identity-fixtures";
import { INVITATIONS_PAGE_SIZE, listPendingInvitations } from "./list-pending-invitations";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => listPendingInvitations(createInMemoryIdentityDependencies(state, () => NOW));
const technician = organizationActorWith("technician");

const addPending = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    state.invitations.push(
      inMemoryInvitation({
        id: `invitation-${String(index).padStart(3, "0")}`,
        organizationId: "organization-a",
      }),
    ),
  );

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("listPendingInvitations", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s see the pending invitations", async (role) => {
    addPending(1);
    expect((await run()(organizationActorWith(role), {})).invitations).toHaveLength(1);
  });

  it("stays readable during an impersonation", async () => {
    addPending(1);
    const page = await run()(organizationActorWith("owner", { isImpersonating: true }), {});
    expect(page.invitations).toHaveLength(1);
  });

  it("lists only pending invitations of the actor's organization", async () => {
    addPending(1);
    state.invitations.push(
      inMemoryInvitation({
        id: "invitation-accepted",
        organizationId: "organization-a",
        status: "accepted",
      }),
      inMemoryInvitation({
        id: "invitation-canceled",
        organizationId: "organization-a",
        status: "canceled",
      }),
      inMemoryInvitation({ id: "invitation-b", organizationId: "organization-b" }),
    );
    expect(await run()(technician, {})).toEqual({
      invitations: [
        {
          id: "invitation-000",
          email: "invitation-000@example.fr",
          role: "technician",
          expiresAt: new Date("2026-10-30T10:00:00Z"),
          sentAt: NOW,
        },
      ],
      nextCursor: null,
    });
  });

  it("walks through 50 invitations per page", async () => {
    expect(INVITATIONS_PAGE_SIZE).toBe(50);
    addPending(INVITATIONS_PAGE_SIZE + 1);
    const first = await run()(technician, {});
    const second = await run()(technician, { afterId: first.nextCursor ?? "" });
    expect(first.invitations).toHaveLength(50);
    expect(first.nextCursor).toBe("invitation-049");
    expect(second.invitations.map(({ id }) => id)).toEqual(["invitation-050"]);
    expect(second.nextCursor).toBeNull();
  });
});
