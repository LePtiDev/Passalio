import { accountFileResponse, ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryAccount,
  inMemoryMember,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import { getAccountFile } from "./get-account-file";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryBackofficeState;
const run = () => getAccountFile(createInMemoryBackofficeDependencies(state, () => NOW));
const admin = platformActorWith("admin");

beforeEach(() => {
  state = createInMemoryBackofficeState();
  state.accounts.push(
    inMemoryAccount({
      id: "organization-a",
      name: "Ramonage A",
      siret: "12345678900011",
      address: "1 rue du Four, Paris",
      phone: "0102030405",
      trades: ["chimney_sweeping"],
      customerCount: 42,
      createdAt: new Date("2026-10-15T08:00:00Z"),
    }),
  );
});

describe("getAccountFile", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("opens an account file to a %s", async (role) => {
    const result = await run()(platformActorWith(role), "organization-a");
    expect(result.isOk).toBe(true);
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

  it("gives the profile, the owner, the staff count and the usage of the whole team", async () => {
    state.members.push(
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-jean",
        name: "Jean",
        email: "jean@ramonage-a.fr",
        role: "owner",
        recent: 4,
        previous: 10,
      }),
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-paul",
        name: "Paul",
        role: "technician",
        recent: 2,
        previous: 10,
      }),
      inMemoryMember({
        organizationId: "organization-b",
        userId: "user-other",
        name: "Other",
        role: "owner",
        recent: 30,
        previous: 0,
      }),
    );
    const result = await run()(admin, "organization-a");
    expect(result).toEqual({
      isOk: true,
      value: {
        account: {
          id: "organization-a",
          name: "Ramonage A",
          siret: "12345678900011",
          address: "1 rue du Four, Paris",
          phone: "0102030405",
          trades: ["chimney_sweeping"],
          customerCount: 42,
          createdAt: "2026-10-15T08:00:00.000Z",
          trialEndsAt: "2026-10-22T08:00:00.000Z",
          isInTrial: false,
        },
        owner: { name: "Jean", email: "jean@ramonage-a.fr" },
        staffCount: 2,
        trend: { recent: 6, previous: 20, changePercent: -70, isDropping: true },
      },
    });
    expect(result.isOk && accountFileResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
  });

  it("has no owner and no usage for an account without members", async () => {
    const result = await run()(admin, "organization-a");
    expect(result.isOk && result.value.owner).toBeNull();
    expect(result.isOk && result.value.staffCount).toBe(0);
    expect(result.isOk && result.value.trend).toEqual({
      recent: 0,
      previous: 0,
      changePercent: null,
      isDropping: false,
    });
  });

  it("tells an account is no longer in trial after 7 days", async () => {
    state.accounts.push(
      inMemoryAccount({
        id: "organization-old",
        name: "Old",
        createdAt: new Date("2026-10-16T10:00:00Z"),
      }),
    );
    const result = await run()(admin, "organization-old");
    expect(result.isOk && result.value.account.isInTrial).toBe(false);
  });
});
