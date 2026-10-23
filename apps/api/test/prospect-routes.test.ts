import {
  prospectCompaniesPageResponse,
  prospectCompanyFileResponse,
  prospectCompanyResponse,
  prospectContactFileResponse,
  prospectContactResponse,
  prospectContactsPageResponse,
  prospectFiltersResponse,
  prospectMapResponse,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let admin: string;
let sales: string;
let gilles: z.infer<typeof prospectCompanyResponse>;
let gazHop: z.infer<typeof prospectCompanyResponse>;

const send = (cookie: string, path: string, method: string, body?: unknown) =>
  platform.request(
    `/api/admin/prospects${path}`,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    cookie,
  );

const read = async <Schema extends z.ZodType>(cookie: string, path: string, schema: Schema) => {
  const response = await send(cookie, path, "GET");
  expect(response.status).toBe(200);
  return schema.parse(await response.json());
};

const createCompany = async (body: Record<string, unknown>) => {
  const response = await send(admin, "/companies", "POST", body);
  expect(response.status).toBe(201);
  return prospectCompanyResponse.parse(await response.json());
};

beforeAll(async () => {
  platform = await startTestPlatform();
  admin = await signInAsAdmin(platform, "quentin@passalio.com");
  sales = await signInAsAdmin(platform, "antho@passalio.com", "sales");
  gilles = await createCompany({
    name: "Entreprise Sauvageot Gilles",
    address: "12 rue Véron",
    postalCode: "94140",
    city: "Alfortville",
    department: "94",
    latitude: 48.8,
    longitude: 2.42,
    phone: "01 43 00 00 00",
  });
  gazHop = await createCompany({ name: "Gaz Hop", city: "Alfortville", department: "94" });
  await createCompany({ name: "La Parisienne de Ramonage", city: "Paris", department: "75" });
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("prospect access", () => {
  it("hides the prospects from a regular user", async () => {
    const cookie = await platform.signIn("ramoneur@example.fr");
    expect((await send(cookie, "/companies", "GET")).status).toBe(404);
  });

  it("lets the sales role work on prospects but not read client accounts", async () => {
    const page = await read(sales, "/companies", prospectCompaniesPageResponse);
    expect(page.companies).toHaveLength(3);
    const accounts = await platform.request("/api/admin/accounts", {}, sales);
    expect(accounts.status).toBe(403);
  });
});

describe("prospect companies", () => {
  it("lists companies by name with stage counts and a department filter", async () => {
    const page = await read(admin, "/companies?department=94", prospectCompaniesPageResponse);
    expect(page.companies.map(({ name }) => name)).toEqual([
      "Entreprise Sauvageot Gilles",
      "Gaz Hop",
    ]);
    expect(page.counts).toMatchObject({ all: 2, to_qualify: 2, interested: 0 });
    expect(page.nextCursor).toBeNull();
  });

  it("searches by name or city without accents", async () => {
    const page = await read(admin, "/companies?q=alfortvil", prospectCompaniesPageResponse);
    expect(page.companies).toHaveLength(2);
    const byName = await read(admin, "/companies?q=parisienne", prospectCompaniesPageResponse);
    expect(byName.companies.map(({ name }) => name)).toEqual(["La Parisienne de Ramonage"]);
  });

  it("changes the stage and records it in the history", async () => {
    const changed = await send(sales, `/companies/${gilles.id}/stage`, "POST", {
      stage: "interested",
    });
    expect(changed.status).toBe(204);
    const interested = await read(
      admin,
      "/companies?stage=interested",
      prospectCompaniesPageResponse,
    );
    expect(interested.companies.map(({ id }) => id)).toEqual([gilles.id]);
    expect(interested.counts).toMatchObject({ interested: 1, to_qualify: 2 });
    const file = await read(admin, `/companies/${gilles.id}`, prospectCompanyFileResponse);
    expect(file.events[0]).toMatchObject({
      kind: "stage_changed",
      fromStage: "to_qualify",
      toStage: "interested",
      authorName: "antho",
    });
  });

  it("assigns an owner who must belong to the Passalio team", async () => {
    const filters = await read(admin, "/filters", prospectFiltersResponse);
    const antho = filters.owners.find(({ name }) => name === "antho");
    expect(filters.departments).toEqual([
      { code: "75", count: 1 },
      { code: "94", count: 2 },
    ]);
    const assigned = await send(admin, `/companies/${gazHop.id}`, "PATCH", {
      ownerUserId: antho?.id,
    });
    expect(assigned.status).toBe(204);
    const owned = await read(
      admin,
      `/companies?owner=${antho?.id ?? ""}`,
      prospectCompaniesPageResponse,
    );
    expect(owned.companies.map(({ name, owner }) => [name, owner?.name])).toEqual([
      ["Gaz Hop", "antho"],
    ]);
    await platform.signIn("ramoneur@example.fr");
    const outsiderId = (
      await platform.env.DB.prepare("SELECT id FROM users WHERE email = ?")
        .bind("ramoneur@example.fr")
        .first<{ id: string }>()
    )?.id;
    const refused = await send(admin, `/companies/${gazHop.id}`, "PATCH", {
      ownerUserId: outsiderId,
    });
    expect(refused.status).toBe(422);
  });

  it("puts geolocated companies on the map", async () => {
    const map = await read(admin, "/map?department=94", prospectMapResponse);
    expect(map.pins).toEqual([
      expect.objectContaining({ id: gilles.id, latitude: 48.8, longitude: 2.42 }),
    ]);
  });

  it("answers not found for an unknown company", async () => {
    const response = await send(admin, "/companies/0199c8a4-0000-7000-8000-000000000000", "GET");
    expect(response.status).toBe(404);
  });
});

describe("prospect contacts and notes", () => {
  it("adds contacts, keeps a single main contact and lists them", async () => {
    const leader = await send(admin, `/companies/${gilles.id}/contacts`, "POST", {
      firstName: "Gilles",
      lastName: "Sauvageot",
      jobTitle: "Gérant",
      isLeader: true,
      isMain: true,
    });
    expect(leader.status).toBe(201);
    const assistant = await send(admin, `/companies/${gilles.id}/contacts`, "POST", {
      lastName: "Sauvageot",
      firstName: "Marie",
      jobTitle: "Administratif",
      isMain: true,
      mobile: "06 00 00 00 01",
    });
    const marie = prospectContactResponse.parse(await assistant.json());
    const file = await read(admin, `/companies/${gilles.id}`, prospectCompanyFileResponse);
    expect(file.contacts.map(({ name, isMain }) => [name, isMain])).toEqual([
      ["Marie Sauvageot", true],
      ["Gilles Sauvageot", false],
    ]);
    const page = await read(admin, "/contacts?department=94", prospectContactsPageResponse);
    expect(page.counts).toEqual({ all: 2, leaders: 1, no_phone: 0 });
    expect(page.contacts.map(({ name, phone }) => [name, phone])).toEqual([
      ["Gilles Sauvageot", "01 43 00 00 00"],
      ["Marie Sauvageot", "06 00 00 00 01"],
    ]);
    const leaders = await read(admin, "/contacts?filter=leaders", prospectContactsPageResponse);
    expect(leaders.contacts.map(({ name }) => name)).toEqual(["Gilles Sauvageot"]);

    const note = await send(sales, `/companies/${gilles.id}/notes`, "POST", {
      body: "Rappeler mardi matin.",
      contactId: marie.id,
    });
    expect(note.status).toBe(201);
    const contactFile = await read(admin, `/contacts/${marie.id}`, prospectContactFileResponse);
    expect(contactFile.company.name).toBe("Entreprise Sauvageot Gilles");
    expect(contactFile.events.map(({ body, contact }) => [body, contact?.name])).toEqual([
      ["Rappeler mardi matin.", "Marie Sauvageot"],
    ]);
  });

  it("refuses a note about a contact of another company", async () => {
    const contacts = await read(admin, "/contacts", prospectContactsPageResponse);
    const otherContact = contacts.contacts[0];
    const response = await send(admin, `/companies/${gazHop.id}/notes`, "POST", {
      body: "Note",
      contactId: otherContact?.id,
    });
    expect(response.status).toBe(422);
  });

  it("deletes a company with its contacts and history, and logs it", async () => {
    const response = await send(admin, `/companies/${gilles.id}`, "DELETE");
    expect(response.status).toBe(204);
    const contacts = await read(admin, "/contacts", prospectContactsPageResponse);
    expect(contacts.counts.all).toBe(0);
    const logged = await platform.env.DB.prepare(
      "SELECT count(*) AS total FROM audit_logs WHERE action = 'prospect.company_deleted' AND target_id = ?",
    )
      .bind(gilles.id)
      .first<{ total: number }>();
    expect(logged?.total).toBe(1);
  });
});
