import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });

let platform: TestPlatform;
let owner: string;
let technician: string;
let otherOwner: string;

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const createOrganization = async (cookie: string, body: Record<string, unknown>) => {
  const response = await platform.request("/api/organizations", json(body), cookie);
  const { organization } = organizationResponse.parse(await response.json());
  await platform.setActiveOrganization(cookie, organization.id);
  return organization.id;
};

const profileOf = async (cookie: string) => {
  const response = await platform.request("/api/organization", {}, cookie);
  return z.object({ organization: z.record(z.string(), z.unknown()) }).parse(await response.json())
    .organization;
};

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-profil@example.fr");
  await createOrganization(owner, {
    name: "Ramonage Dupont",
    siret: "123 456 789 00012",
    address: "12 rue Paul Bert, 69003 Lyon",
    teamSize: "2_to_5",
  });
  await platform.request(
    "/api/invitations",
    json({ email: "tech-profil@example.fr", role: "technician" }),
    owner,
  );
  const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
  technician = await platform.signIn("tech-profil@example.fr");
  const accepted = await platform.request(
    `/api${invitationPath}/accept`,
    { method: "POST" },
    technician,
  );
  const { member } = z
    .object({ member: z.object({ organizationId: z.string() }) })
    .parse(await accepted.json());
  await platform.setActiveOrganization(technician, member.organizationId);
  otherOwner = await platform.signIn("autre-profil@example.fr");
  await createOrganization(otherOwner, { name: "Autre Ramonage" });
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("organization profile", () => {
  it("returns the company details given at creation, without internal fields", async () => {
    expect(await profileOf(technician)).toEqual({
      id: expect.any(String),
      name: "Ramonage Dupont",
      siret: "12345678900012",
      address: "12 rue Paul Bert, 69003 Lyon",
      phone: null,
      teamSize: "2_to_5",
      trades: [],
      brandColor: "#0F2A44",
      documentNumberPrefix: "",
      nextDocumentNumber: 1,
      hasLogo: false,
      isOnboardingCompleted: false,
    });
  });

  it("lets the owner save trades and numbering", async () => {
    const response = await platform.request(
      "/api/organization",
      json(
        {
          trades: ["chimney_sweeping", "stove_maintenance"],
          brandColor: "#0E7C5A",
          documentNumberPrefix: "2026-",
          nextDocumentNumber: 1,
        },
        "PATCH",
      ),
      owner,
    );
    expect(response.status).toBe(204);
    expect(await profileOf(owner)).toMatchObject({
      trades: ["chimney_sweeping", "stove_maintenance"],
      brandColor: "#0E7C5A",
      documentNumberPrefix: "2026-",
    });
  });

  it("keeps each company separate", async () => {
    expect(await profileOf(otherOwner)).toMatchObject({ name: "Autre Ramonage", trades: [] });
  });

  it("refuses an unknown trade and a technician", async () => {
    const unknownTrade = await platform.request(
      "/api/organization",
      json({ trades: ["plumbing"] }, "PATCH"),
      owner,
    );
    expect(unknownTrade.status).toBe(400);
    const fromTechnician = await platform.request(
      "/api/organization",
      json({ name: "Piraté" }, "PATCH"),
      technician,
    );
    expect(fromTechnician.status).toBe(403);
  });

  it("marks the onboarding as completed", async () => {
    const response = await platform.request(
      "/api/organization/onboarding-completion",
      { method: "POST" },
      owner,
    );
    expect(response.status).toBe(204);
    expect(await profileOf(owner)).toMatchObject({ isOnboardingCompleted: true });
  });
});

describe("organization logo", () => {
  it("stores a PNG and serves it with safe headers", async () => {
    const upload = await platform.request(
      "/api/organization/logo",
      {
        method: "PUT",
        body: new Uint8Array([137, 80, 78, 71]),
        headers: { "content-type": "image/png" },
      },
      owner,
    );
    expect(upload.status).toBe(204);
    const logo = await platform.request("/api/organization/logo", {}, technician);
    expect(logo.status).toBe(200);
    expect(logo.headers.get("content-type")).toBe("image/png");
    expect(logo.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await logo.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(await profileOf(owner)).toMatchObject({ hasLogo: true });
  });

  it("refuses a PDF", async () => {
    const upload = await platform.request(
      "/api/organization/logo",
      {
        method: "PUT",
        body: new Uint8Array([1, 2, 3]),
        headers: { "content-type": "application/pdf" },
      },
      owner,
    );
    expect(upload.status).toBe(422);
  });

  it("answers not found for a company without logo", async () => {
    const logo = await platform.request("/api/organization/logo", {}, otherOwner);
    expect(logo.status).toBe(404);
  });
});

describe("company search", () => {
  it("maps the public Sirene results", async () => {
    const sirene = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        results: [
          {
            nom_complet: "RAMONAGE DUPONT",
            siege: {
              siret: "12345678900012",
              adresse: "12 RUE PAUL BERT 69003 LYON",
              code_postal: "69003",
              libelle_commune: "LYON",
            },
          },
        ],
      }),
    );
    const response = await platform.request("/api/company-search?q=ramonage%20dupont", {}, owner);
    expect(await response.json()).toEqual({
      companies: [
        {
          name: "RAMONAGE DUPONT",
          siret: "12345678900012",
          address: "12 RUE PAUL BERT 69003 LYON",
          postalCode: "69003",
          city: "LYON",
        },
      ],
    });
    const [calledUrl] = sirene.mock.calls[0] ?? [];
    expect(calledUrl instanceof URL && calledUrl.searchParams.get("etat_administratif")).toBe("A");
    sirene.mockRestore();
  });

  it("answers 503 when the directory is down", async () => {
    const sirene = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("indisponible", { status: 502 }));
    const response = await platform.request("/api/company-search?q=ramonage", {}, owner);
    expect(response.status).toBe(503);
    sirene.mockRestore();
  });

  it("requires a signed-in user", async () => {
    const response = await platform.request("/api/company-search?q=ramonage");
    expect(response.status).toBe(401);
  });
});
