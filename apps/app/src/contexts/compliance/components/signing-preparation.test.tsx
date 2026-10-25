import { err, ok, type NumberBlockResponse } from "@passalio/shared";
import type { DocumentLogo } from "@passalio/trades";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentSettings, OrganizationProfile } from "@/contexts/identity";
import type { ApiResult } from "@/lib/api-client";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { LocalSession } from "@/lib/db/local-database-context";
import { createTestDatabase } from "@/lib/db/test-database";
import { numberBlock } from "@/test-support/certificate-records";
import { readIssuer } from "../issuer-store";
import { SigningPreparation } from "./signing-preparation";

type Reserve = (deviceId: string) => Promise<ApiResult<NumberBlockResponse>>;

type TestContext = {
  session: LocalSession | undefined;
  canSign: boolean;
  organization: OrganizationProfile | undefined;
  settings: DocumentSettings | undefined;
  logo: DocumentLogo | undefined;
  logoRequests: boolean[];
  reserve: Reserve | undefined;
};

const context = vi.hoisted(() => {
  const initial: TestContext = {
    session: undefined,
    canSign: true,
    organization: undefined,
    settings: undefined,
    logo: undefined,
    logoRequests: [],
    reserve: undefined,
  };
  return initial;
});

vi.mock("@/lib/db/local-database-context", () => ({
  useLocalSession: () => context.session,
}));

vi.mock("@/lib/permissions/use-can", () => ({
  useCan: () => context.canSign,
}));

vi.mock("@/contexts/identity", () => ({
  useOrganization: () => ({ data: context.organization }),
  useDocumentSettings: () => ({ data: context.settings }),
  useOrganizationPdfLogo: (isEnabled: boolean) => {
    context.logoRequests.push(isEnabled);
    return { data: isEnabled ? context.logo : undefined };
  },
}));

vi.mock("../compliance-api", () => ({
  complianceApi: {
    reserveNumberBlock: (deviceId: string) =>
      context.reserve === undefined
        ? Promise.reject(new Error("no reserve"))
        : context.reserve(deviceId),
  },
}));

const ORGANIZATION: OrganizationProfile = {
  id: "organization-1",
  name: "Ramonage Dupont",
  siret: "12345678900012",
  address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
  phone: "01 45 00 00 00",
  teamSize: "solo",
  trades: ["chimney_sweeping"],
  brandColor: "#0F2A44",
  documentNumberPrefix: "RD-",
  nextDocumentNumber: 1,
  hasLogo: false,
  isOnboardingCompleted: true,
};

const SETTINGS: DocumentSettings = {
  legalForm: "ei",
  shareCapitalEuros: null,
  registryKind: "rne",
  registryCity: null,
  apeCode: null,
  qualification: null,
  documentTemplate: "banner",
  contactEmail: null,
  website: null,
  customerMessage: null,
  footerText: null,
  hasReservedNumbers: false,
  missingLegalMentions: [],
};

const BLOCK: NumberBlockResponse = {
  id: "block-1",
  deviceId: "0190f3a0-0000-7000-8000-00000000d001",
  numberPrefix: "RD-",
  firstNumber: 1,
  lastNumber: 20,
};

let database: LocalDatabase;
let reserve: ReturnType<typeof vi.fn<Reserve>>;

beforeEach(() => {
  database = createTestDatabase();
  reserve = vi.fn<Reserve>(async () => ok(BLOCK));
  Object.assign(context, {
    session: { database, actor: { userId: "user-1", organizationId: "organization-1" } },
    canSign: true,
    organization: ORGANIZATION,
    settings: SETTINGS,
    logo: undefined,
    logoRequests: [],
    reserve,
  });
});

describe("SigningPreparation", () => {
  it("copies the company and document settings to the device", async () => {
    render(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(async () => expect(await readIssuer(database)).toBeDefined());
    expect(await readIssuer(database)).toMatchObject({
      company: { name: "Ramonage Dupont", legalForm: "ei", registry: { kind: "rne" } },
      missingLegalMentions: [],
      branding: { template: "banner", brandColor: "#0F2A44", logo: null },
    });
    await vi.waitFor(async () => expect(await database.numberBlocks.count()).toBe(1));
  });

  it("waits for the logo before copying the settings of a company that has one", async () => {
    context.organization = { ...ORGANIZATION, hasLogo: true };
    const view = render(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(() => expect(reserve).toHaveBeenCalled());
    expect(await readIssuer(database)).toBeUndefined();

    context.logo = { format: "png", base64: "iVBORw0KGgo=" };
    view.rerender(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(async () =>
      expect((await readIssuer(database))?.branding.logo).toEqual(context.logo),
    );
    await vi.waitFor(async () => expect(await database.numberBlocks.count()).toBe(1));
  });

  it("reserves a block of numbers for this device", async () => {
    render(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(async () => expect(await database.numberBlocks.count()).toBe(1));
    expect(reserve).toHaveBeenCalledTimes(1);
  });

  it("does not reserve while the device has enough numbers", async () => {
    await database.numberBlocks.put(numberBlock());
    render(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(async () => expect(await readIssuer(database)).toBeDefined());
    expect(reserve).not.toHaveBeenCalled();
  });

  it("reserves once the connection is back", async () => {
    reserve.mockResolvedValueOnce(err({ code: "network", traceId: null }));
    render(<SigningPreparation userName="Jean Dupont" />);
    await vi.waitFor(() => expect(reserve).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event("online"));
    await vi.waitFor(async () => expect(await database.numberBlocks.count()).toBe(1));
  });

  it("keeps the name of the signer for the certificate", async () => {
    render(<SigningPreparation userName=" Jean Dupont " />);
    await vi.waitFor(async () =>
      expect(await database.localSettings.get("signer")).toEqual({
        key: "signer",
        userId: "user-1",
        name: "Jean Dupont",
      }),
    );
    await vi.waitFor(async () => expect(await database.numberBlocks.count()).toBe(1));
  });

  it("prepares nothing for a member who cannot sign", async () => {
    context.canSign = false;
    context.organization = { ...ORGANIZATION, hasLogo: true };
    render(<SigningPreparation userName="Jean Dupont" />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(reserve).not.toHaveBeenCalled();
    expect(await readIssuer(database)).toBeUndefined();
    expect(context.logoRequests.every((isEnabled) => !isEnabled)).toBe(true);
    expect(await database.localSettings.get("signer")).toBeUndefined();
  });
});
