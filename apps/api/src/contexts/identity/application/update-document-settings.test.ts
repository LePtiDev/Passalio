import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { updateOrganizationProfile } from "./update-organization-profile";

let state: InMemoryIdentityState;
const run = () => updateOrganizationProfile(createInMemoryIdentityDependencies(state));
const owner = organizationActorWith("owner");

const reserveNumbersUpTo = (nextDocumentNumber: number) => {
  state.organizations.forEach((organization, index) => {
    state.organizations[index] = { ...organization, nextDocumentNumber, hasReservedNumbers: true };
  });
};

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
});

describe("updateOrganizationProfile, legal details and documents", () => {
  it("saves the legal details and the look of the documents", async () => {
    expect(
      await run()(owner, {
        legalForm: "sas",
        shareCapitalEuros: 5000,
        registryKind: "rcs",
        registryCity: " Créteil ",
        apeCode: "43.22b",
        qualification: "Qualibat 5131",
        documentTemplate: "plain",
        contactEmail: "contact@ramonage-dupont.fr",
        website: "ramonage-dupont.fr",
        customerMessage: "Merci de votre confiance.",
        footerText: "Assurance RC professionnelle : MAAF Pro.",
        isAdviceAttachedByDefault: false,
      }),
    ).toEqual({ isOk: true, value: undefined });
    expect(state.organizations[0]).toMatchObject({
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
      isAdviceAttachedByDefault: false,
    });
  });

  it("refuses a wrong APE code and saves nothing", async () => {
    expect(await run()(owner, { apeCode: "43", qualification: "Qualibat" })).toEqual({
      isOk: false,
      error: "invalid_ape_code",
    });
    expect(state.organizations[0]?.qualification).toBeNull();
    expect(state.auditEntries).toEqual([]);
  });

  it("lets the company choose any next number before a number is reserved", async () => {
    await run()(owner, { nextDocumentNumber: 143 });
    expect(await run()(owner, { nextDocumentNumber: 12 })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.organizations[0]?.nextDocumentNumber).toBe(12);
  });

  it("refuses to move the next number back once numbers are reserved", async () => {
    reserveNumbersUpTo(41);
    expect(await run()(owner, { nextDocumentNumber: 40 })).toEqual({
      isOk: false,
      error: "document_number_already_used",
    });
    expect(state.organizations[0]?.nextDocumentNumber).toBe(41);
    expect(state.auditEntries).toEqual([]);
  });

  it("lets the company keep or raise the next number once numbers are reserved", async () => {
    reserveNumbersUpTo(41);
    expect((await run()(owner, { nextDocumentNumber: 41 })).isOk).toBe(true);
    expect((await run()(owner, { nextDocumentNumber: 500 })).isOk).toBe(true);
    expect(state.organizations[0]?.nextDocumentNumber).toBe(500);
  });

  it("answers organization_not_found when the organization is gone", async () => {
    state.organizations.splice(0, 1);
    expect(await run()(owner, { qualification: "Qualibat" })).toEqual({
      isOk: false,
      error: "organization_not_found",
    });
  });
});
