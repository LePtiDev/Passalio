import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { createChimneySweepingOrganization, joinOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const settingsResponse = z.object({ settings: z.record(z.string(), z.unknown()) });
const errorResponse = z.object({ error: z.string(), traceId: z.string() });

let platform: TestPlatform;
let owner: string;
let technician: string;
let otherOwner: string;

const settingsOf = async (cookie: string) => {
  const response = await platform.request("/api/organization/document-settings", {}, cookie);
  expect(response.status).toBe(200);
  return settingsResponse.parse(await response.json()).settings;
};

const patch = (body: unknown, cookie = owner) =>
  platform.request("/api/organization", jsonBody(body, "PATCH"), cookie);

const uploadLogo = (cookie = owner) =>
  platform.request(
    "/api/organization/logo",
    {
      method: "PUT",
      body: new Uint8Array([137, 80, 78, 71]),
      headers: { "content-type": "image/png" },
    },
    cookie,
  );

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-documents@example.fr");
  const organizationId = await createChimneySweepingOrganization(
    platform,
    owner,
    "Ramonage Dupont",
  );
  technician = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "technicien-documents@example.fr",
    role: "technician",
  });
  otherOwner = await platform.signIn("autre-documents@example.fr");
  await createChimneySweepingOrganization(platform, otherOwner, "Autre Ramonage");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("document settings", () => {
  it("asks to sign in before reading the settings", async () => {
    expect((await platform.request("/api/organization/document-settings")).status).toBe(401);
  });

  it("gives a new company the default look and lists the legal mentions to fill in", async () => {
    expect(await settingsOf(otherOwner)).toEqual({
      legalForm: null,
      shareCapitalEuros: null,
      registryKind: null,
      registryCity: null,
      apeCode: null,
      qualification: null,
      documentTemplate: "banner",
      contactEmail: null,
      website: null,
      customerMessage: null,
      footerText: null,
      hasReservedNumbers: false,
      missingLegalMentions: ["legalForm", "siret", "registry", "address"],
    });
  });

  it("saves the legal details and the look of the documents for the whole team", async () => {
    const response = await patch({
      siret: "912 345 678 00018",
      address: "12 rue des Tilleuls, 94100 Saint-Maur-des-Fossés",
      legalForm: "sas",
      shareCapitalEuros: 5000,
      registryKind: "rcs",
      registryCity: "Créteil",
      apeCode: "4322B",
      qualification: "Qualibat 5131",
      documentTemplate: "plain",
      contactEmail: "contact@ramonage-dupont.fr",
      website: "ramonage-dupont.fr",
      customerMessage: "Merci de votre confiance.",
      footerText: "Assurance RC professionnelle : MAAF Pro.",
    });
    expect(response.status).toBe(204);
    expect(await settingsOf(technician)).toMatchObject({
      legalForm: "sas",
      shareCapitalEuros: 5000,
      registryKind: "rcs",
      registryCity: "Créteil",
      apeCode: "4322B",
      qualification: "Qualibat 5131",
      documentTemplate: "plain",
      contactEmail: "contact@ramonage-dupont.fr",
      website: "ramonage-dupont.fr",
      customerMessage: "Merci de votre confiance.",
      footerText: "Assurance RC professionnelle : MAAF Pro.",
      missingLegalMentions: [],
    });
  });

  it("keeps each company's settings separate", async () => {
    expect(await settingsOf(otherOwner)).toMatchObject({
      legalForm: null,
      documentTemplate: "banner",
    });
  });

  it("asks again for the share capital when it is cleared", async () => {
    expect((await patch({ shareCapitalEuros: null })).status).toBe(204);
    expect(await settingsOf(owner)).toMatchObject({ missingLegalMentions: ["shareCapitalEuros"] });
    expect((await patch({ shareCapitalEuros: 5000 })).status).toBe(204);
  });

  it("refuses a wrong APE code with its trace id", async () => {
    const response = await patch({ apeCode: "43" });
    expect(response.status).toBe(422);
    expect(errorResponse.parse(await response.json()).error).toBe("invalid_ape_code");
  });

  it.each([
    ["an invalid e-mail", { contactEmail: "pas-un-email" }],
    ["an unknown template", { documentTemplate: "fancy" }],
    ["an unknown legal form", { legalForm: "gie" }],
    ["a capital of 0 €", { shareCapitalEuros: 0 }],
    ["a message over 300 characters", { customerMessage: "a".repeat(301) }],
  ])("refuses %s", async (_, body) => {
    expect((await patch(body)).status).toBe(400);
  });

  it("forbids a technician to change the documents", async () => {
    expect((await patch({ documentTemplate: "banner" }, technician)).status).toBe(403);
    expect(await settingsOf(owner)).toMatchObject({ documentTemplate: "plain" });
  });
});

describe("removing the logo", () => {
  it("removes the logo so it is no longer served", async () => {
    expect((await uploadLogo()).status).toBe(204);
    expect(
      (await platform.request("/api/organization/logo", { method: "DELETE" }, owner)).status,
    ).toBe(204);
    expect((await platform.request("/api/organization/logo", {}, owner)).status).toBe(404);
  });

  it("answers not found when there is no logo to remove", async () => {
    const response = await platform.request("/api/organization/logo", { method: "DELETE" }, owner);
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("logo_not_found");
  });

  it("forbids a technician to remove the logo", async () => {
    expect((await uploadLogo()).status).toBe(204);
    expect(
      (await platform.request("/api/organization/logo", { method: "DELETE" }, technician)).status,
    ).toBe(403);
    expect((await platform.request("/api/organization/logo", {}, owner)).status).toBe(200);
  });
});
