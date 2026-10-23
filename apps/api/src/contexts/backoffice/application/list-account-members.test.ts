import { accountMembersResponse, ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryAccount,
  inMemoryMember,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import { listAccountMembers } from "./list-account-members";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryBackofficeState;
const run = () => listAccountMembers(createInMemoryBackofficeDependencies(state, () => NOW));
const admin = platformActorWith("admin");

beforeEach(() => {
  state = createInMemoryBackofficeState();
  state.accounts.push(
    inMemoryAccount({
      id: "organization-a",
      name: "Ramonage A",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    }),
  );
});

describe("listAccountMembers", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("shows the staff to a %s", async (role) => {
    expect((await run()(platformActorWith(role), "organization-a")).isOk).toBe(true);
  });

  it("refuses the sales role, which has no access to client accounts", async () => {
    await expect(run()(platformActorWith("sales"), "organization-a")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("answers not found for an unknown account", async () => {
    expect(await run()(admin, "organization-unknown")).toEqual({
      isOk: false,
      error: "account_not_found",
    });
  });

  it("answers empty lists for an account without members nor invitations", async () => {
    expect(await run()(admin, "organization-a")).toEqual({
      isOk: true,
      value: { members: [], invitations: [] },
    });
  });

  it("lists the members with their security status and the pending invitations of this account only", async () => {
    state.members.push(
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-jean",
        name: "Jean",
        email: "jean@ramonage-a.fr",
        role: "owner",
        lastActiveDay: "2026-10-22",
        recent: 12,
        previous: 10,
        isTwoFactorEnabled: true,
        isBlocked: false,
      }),
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-paul",
        name: "Paul",
        email: "paul@ramonage-a.fr",
        role: "technician",
        isBlocked: true,
      }),
      inMemoryMember({
        organizationId: "organization-b",
        userId: "user-other",
        name: "Other",
        role: "owner",
      }),
    );
    state.invitations.push(
      {
        organizationId: "organization-a",
        email: "lea@ramonage-a.fr",
        role: "secretary",
        createdAt: new Date("2026-10-20T09:00:00Z"),
      },
      {
        organizationId: "organization-b",
        email: "other@example.fr",
        role: "admin",
        createdAt: new Date("2026-10-20T09:00:00Z"),
      },
    );
    const result = await run()(admin, "organization-a");
    expect(result.isOk && accountMembersResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
    expect(result).toEqual({
      isOk: true,
      value: {
        members: [
          {
            userId: "user-jean",
            name: "Jean",
            email: "jean@ramonage-a.fr",
            role: "owner",
            lastActiveDay: "2026-10-22",
            trend: { recent: 12, previous: 10, changePercent: 20, isDropping: false },
            isTwoFactorEnabled: true,
            isBlocked: false,
          },
          {
            userId: "user-paul",
            name: "Paul",
            email: "paul@ramonage-a.fr",
            role: "technician",
            lastActiveDay: null,
            trend: { recent: 0, previous: 0, changePercent: null, isDropping: false },
            isTwoFactorEnabled: false,
            isBlocked: true,
          },
        ],
        invitations: [
          { email: "lea@ramonage-a.fr", role: "secretary", createdAt: "2026-10-20T09:00:00.000Z" },
        ],
      },
    });
  });
});
