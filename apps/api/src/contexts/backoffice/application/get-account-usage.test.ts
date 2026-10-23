import { accountUsageResponse, ForbiddenError, type PlatformRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemoryBackofficeDependencies,
  createInMemoryBackofficeState,
  inMemoryAccount,
  inMemoryMember,
  type InMemoryBackofficeState,
} from "../infrastructure/in-memory-backoffice-read-model";
import { getAccountUsage } from "./get-account-usage";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryBackofficeState;
const run = () => getAccountUsage(createInMemoryBackofficeDependencies(state, () => NOW));
const admin = platformActorWith("admin");

const emptyMonths = [
  { month: "2026-05", activeDays: 0 },
  { month: "2026-06", activeDays: 0 },
  { month: "2026-07", activeDays: 0 },
  { month: "2026-08", activeDays: 0 },
  { month: "2026-09", activeDays: 0 },
  { month: "2026-10", activeDays: 0 },
];

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

describe("getAccountUsage", () => {
  it.each<PlatformRole>(["superadmin", "admin"])("shows account usage to a %s", async (role) => {
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

  it("gives six empty months for an account without members", async () => {
    expect(await run()(admin, "organization-a")).toEqual({
      isOk: true,
      value: {
        months: emptyMonths,
        trend: { recent: 0, previous: 0, changePercent: null, isDropping: false },
        people: [],
      },
    });
  });

  it("adds up the usage per month and gives each person their own months and trend", async () => {
    state.members.push(
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-jean",
        name: "Jean",
        role: "owner",
        recent: 10,
        previous: 10,
      }),
      inMemoryMember({
        organizationId: "organization-a",
        userId: "user-paul",
        name: "Paul",
        role: "technician",
        recent: 0,
        previous: 8,
      }),
    );
    state.monthlyActivity.push(
      { organizationId: "organization-a", userId: "user-jean", month: "2026-10", activeDays: 5 },
      { organizationId: "organization-a", userId: "user-paul", month: "2026-10", activeDays: 3 },
      { organizationId: "organization-a", userId: "user-paul", month: "2026-08", activeDays: 8 },
      { organizationId: "organization-a", userId: "user-jean", month: "2026-04", activeDays: 9 },
      { organizationId: "organization-b", userId: "user-jean", month: "2026-10", activeDays: 20 },
    );
    const result = await run()(admin, "organization-a");
    expect(result.isOk && accountUsageResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
    expect(result).toEqual({
      isOk: true,
      value: {
        months: [
          { month: "2026-05", activeDays: 0 },
          { month: "2026-06", activeDays: 0 },
          { month: "2026-07", activeDays: 0 },
          { month: "2026-08", activeDays: 8 },
          { month: "2026-09", activeDays: 0 },
          { month: "2026-10", activeDays: 8 },
        ],
        trend: { recent: 10, previous: 18, changePercent: -44, isDropping: true },
        people: [
          {
            userId: "user-jean",
            name: "Jean",
            role: "owner",
            months: emptyMonths.map((entry) =>
              entry.month === "2026-10" ? { ...entry, activeDays: 5 } : entry,
            ),
            trend: { recent: 10, previous: 10, changePercent: 0, isDropping: false },
          },
          {
            userId: "user-paul",
            name: "Paul",
            role: "technician",
            months: emptyMonths.map((entry) =>
              entry.month === "2026-10"
                ? { ...entry, activeDays: 3 }
                : entry.month === "2026-08"
                  ? { ...entry, activeDays: 8 }
                  : entry,
            ),
            trend: { recent: 0, previous: 8, changePercent: -100, isDropping: true },
          },
        ],
      },
    });
  });
});
