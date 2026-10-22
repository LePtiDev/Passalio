import {
  ForbiddenError,
  LOGO_MAX_BYTES,
  type Actor,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  inMemoryOrganization,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { completeOnboarding } from "./complete-onboarding";
import { createOrganization } from "./create-organization";
import { getOrganizationLogo } from "./get-organization-logo";
import { getOrganizationProfile } from "./get-organization-profile";
import { searchCompanies } from "./search-companies";
import { updateOrganizationProfile } from "./update-organization-profile";
import { uploadOrganizationLogo } from "./upload-organization-logo";

const ORGANIZATION_ID = "organization-a";
const NOW = new Date("2026-10-22T10:00:00Z");

let state: InMemoryIdentityState;
const dependencies = () => createInMemoryIdentityDependencies(state, () => NOW);

const actor = (role: OrganizationRole, isImpersonating = false): Actor => ({
  userId: `user-${role}`,
  organizationId: ORGANIZATION_ID,
  role,
  isImpersonating,
});

const profile = () => state.organizations.find(({ id }) => id === ORGANIZATION_ID);

const png = (bytes: number) => ({ body: new ArrayBuffer(bytes), contentType: "image/png" });

beforeEach(() => {
  state = createInMemoryIdentityState();
  state.organizations.push(
    inMemoryOrganization({ id: ORGANIZATION_ID, name: "Ramonage A", slug: "ramonage-a" }),
  );
});

describe("createOrganization with company details", () => {
  it("stores the SIRET without spaces, the address and the team size", async () => {
    const result = await createOrganization(dependencies())(
      { userId: "user-new", email: "new@example.fr", isImpersonating: false },
      {
        name: "Ramonage Dupont",
        siret: "123 456 789 00012",
        address: "12 rue Paul Bert, 69003 Lyon",
        phone: "04 78 00 00 00",
        teamSize: "2_to_5",
      },
    );
    expect(result.isOk).toBe(true);
    expect(state.organizations.at(-1)).toMatchObject({
      siret: "12345678900012",
      address: "12 rue Paul Bert, 69003 Lyon",
      teamSize: "2_to_5",
    });
  });

  it("refuses an invalid SIRET", async () => {
    const result = await createOrganization(dependencies())(
      { userId: "user-new", email: "new@example.fr", isImpersonating: false },
      { name: "Ramonage Dupont", siret: "123" },
    );
    expect(result).toEqual({ isOk: false, error: "invalid_siret" });
  });
});

describe("getOrganizationProfile", () => {
  it("lets a technician read the profile", async () => {
    const result = await getOrganizationProfile(dependencies())(actor("technician"));
    expect(result.isOk && result.value.name).toBe("Ramonage A");
  });
});

describe("updateOrganizationProfile", () => {
  it("saves trades and numbering, then logs the changed fields", async () => {
    const result = await updateOrganizationProfile(dependencies())(actor("admin"), {
      trades: ["chimney_sweeping", "stove_maintenance"],
      brandColor: "#0E7C5A",
      documentNumberPrefix: "2026-",
      nextDocumentNumber: 142,
    });
    expect(result.isOk).toBe(true);
    expect(profile()).toMatchObject({
      trades: ["chimney_sweeping", "stove_maintenance"],
      brandColor: "#0E7C5A",
      documentNumberPrefix: "2026-",
      nextDocumentNumber: 142,
    });
    expect(state.auditEntries.at(-1)).toMatchObject({
      action: "organization.updated",
      data: { fields: "trades,brandColor,documentNumberPrefix,nextDocumentNumber" },
    });
  });

  it("forbids a secretary", async () => {
    await expect(
      updateOrganizationProfile(dependencies())(actor("secretary"), { name: "Autre nom" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("forbids writes during an impersonation", async () => {
    await expect(
      updateOrganizationProfile(dependencies())(actor("owner", true), { name: "Autre nom" }),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("organization logo", () => {
  it("stores an accepted image and serves it back", async () => {
    const uploaded = await uploadOrganizationLogo(dependencies())(actor("owner"), png(1000));
    expect(uploaded.isOk).toBe(true);
    expect(profile()?.logoKey).toBe(`organizations/${ORGANIZATION_ID}/logo`);
    const logo = await getOrganizationLogo(dependencies())(actor("technician"));
    expect(logo.isOk && logo.value.contentType).toBe("image/png");
  });

  it("refuses a file over 2 MB or of another type", async () => {
    const tooBig = await uploadOrganizationLogo(dependencies())(
      actor("owner"),
      png(LOGO_MAX_BYTES + 1),
    );
    const pdf = await uploadOrganizationLogo(dependencies())(actor("owner"), {
      body: new ArrayBuffer(10),
      contentType: "application/pdf",
    });
    expect(tooBig).toEqual({ isOk: false, error: "invalid_logo" });
    expect(pdf).toEqual({ isOk: false, error: "invalid_logo" });
  });

  it("answers not found when there is no logo", async () => {
    const logo = await getOrganizationLogo(dependencies())(actor("owner"));
    expect(logo).toEqual({ isOk: false, error: "logo_not_found" });
  });
});

describe("completeOnboarding", () => {
  it("records the first completion date only", async () => {
    await completeOnboarding(dependencies())(actor("owner"));
    await completeOnboarding(createInMemoryIdentityDependencies(state, () => new Date()))(
      actor("owner"),
    );
    expect(profile()?.onboardingCompletedAt).toEqual(NOW);
  });
});

describe("searchCompanies", () => {
  it("does not search under 3 characters", async () => {
    state.companies.push({
      name: "RAMONAGE DUPONT",
      siret: "12345678900012",
      address: "12 RUE PAUL BERT 69003 LYON",
      postalCode: "69003",
      city: "LYON",
    });
    expect(await searchCompanies(dependencies())("ra")).toEqual({ isOk: true, value: [] });
    const found = await searchCompanies(dependencies())("dupont");
    expect(found.isOk && found.value).toHaveLength(1);
  });
});
