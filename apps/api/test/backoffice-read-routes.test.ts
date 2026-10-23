import {
  accountFileResponse,
  accountMembersResponse,
  accountsPageResponse,
  accountUsageResponse,
  journalPageResponse,
  overviewResponse,
  parisDay,
  parisDayBefore,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });

let platform: TestPlatform;
let admin: string;
let dupontId: string;
let valId: string;

const createOrganization = async (email: string, name: string) => {
  const cookie = await platform.signIn(email);
  const response = await platform.request(
    "/api/organizations",
    { method: "POST", body: JSON.stringify({ name }) },
    cookie,
  );
  return organizationResponse.parse(await response.json()).organization.id;
};

const recordPastActivity = async (email: string, daysAgo: readonly number[]) => {
  const now = new Date();
  await platform.env.DB.batch(
    daysAgo.map((days) =>
      platform.env.DB.prepare(
        "INSERT OR IGNORE INTO activity_days (user_id, day) SELECT id, ? FROM users WHERE email = ?",
      ).bind(parisDayBefore(now, days), email),
    ),
  );
};

const adminGet = async <Schema extends z.ZodType>(path: string, schema: Schema) => {
  const response = await platform.request(`/api/admin${path}`, {}, admin);
  expect(response.status).toBe(200);
  return schema.parse(await response.json());
};

beforeAll(async () => {
  platform = await startTestPlatform();
  admin = await signInAsAdmin(platform, "quentin@passalio.com");
  dupontId = await createOrganization("jean@dupont.fr", "Ramonage Dupont");
  valId = await createOrganization("sophie@cheminees-val.fr", "Cheminées du Val");
  await recordPastActivity("sophie@cheminees-val.fr", [31, 33, 35, 37, 39, 41, 43, 45]);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("admin read routes", () => {
  it("lists client accounts with their staff, usage and counts", async () => {
    const page = await adminGet("/accounts", accountsPageResponse);
    expect(page.accounts.map(({ name }) => name)).toEqual(["Cheminées du Val", "Ramonage Dupont"]);
    expect(page.counts).toEqual({ all: 2, trial: 2, dropping: 1 });
    expect(page.accounts[1]).toMatchObject({
      staffCount: 1,
      staff: [{ name: "jean", role: "owner" }],
      isInTrial: true,
      trend: { recent: 1, previous: 0, isDropping: false },
      lastActive: { day: parisDay(new Date()), name: "jean" },
    });
    expect(page.accounts[0]?.monthlyActivity).toHaveLength(6);
  });

  it("filters accounts whose usage drops and searches by name", async () => {
    const dropping = await adminGet("/accounts?filter=dropping", accountsPageResponse);
    expect(dropping.accounts.map(({ name }) => name)).toEqual(["Cheminées du Val"]);
    expect(dropping.accounts[0]?.trend).toMatchObject({ recent: 1, previous: 8, isDropping: true });
    const searched = await adminGet("/accounts?q=dupont", accountsPageResponse);
    expect(searched.accounts.map(({ id }) => id)).toEqual([dupontId]);
  });

  it("shows an account, its people and its usage per month", async () => {
    const file = await adminGet(`/accounts/${valId}`, accountFileResponse);
    expect(file).toMatchObject({
      account: { name: "Cheminées du Val", customerCount: 0, isInTrial: true },
      owner: { email: "sophie@cheminees-val.fr" },
      staffCount: 1,
      trend: { isDropping: true },
    });
    const people = await adminGet(`/accounts/${valId}/members`, accountMembersResponse);
    expect(people.members).toMatchObject([
      { email: "sophie@cheminees-val.fr", role: "owner", isTwoFactorEnabled: false },
    ]);
    const usage = await adminGet(`/accounts/${valId}/usage`, accountUsageResponse);
    expect(usage.months.reduce((total, { activeDays }) => total + activeDays, 0)).toBe(9);
    expect(usage.people).toHaveLength(1);
  });

  it("answers not found for an unknown account", async () => {
    const response = await platform.request(
      "/api/admin/accounts/0199a3b4-0000-7000-8000-000000000000",
      {},
      admin,
    );
    expect(response.status).toBe(404);
  });

  it("gives the overview and the journals", async () => {
    const overview = await adminGet("/overview", overviewResponse);
    expect(overview.counts).toMatchObject({ all: 2, trial: 2, dropping: 1, endingSoon: 0 });
    expect(overview.dropping.map(({ name }) => name)).toEqual(["Cheminées du Val"]);
    const accountJournal = await adminGet(`/accounts/${dupontId}/journal`, journalPageResponse);
    expect(accountJournal.entries.map(({ action }) => action)).toContain("organization.created");
    const journal = await adminGet("/journal", journalPageResponse);
    expect(journal.entries.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the routes closed to regular users", async () => {
    const cookie = await platform.signIn("jean@dupont.fr");
    const response = await platform.request("/api/admin/accounts", {}, cookie);
    expect(response.status).toBe(404);
  });
});
