import { expect, type BrowserContext, type Page } from "@playwright/test";
import * as z from "zod";

const createdRecord = z.object({ id: z.string() });

export type ProspectStage =
  | "to_qualify"
  | "qualified"
  | "interested"
  | "demo_planned"
  | "customer"
  | "not_interested";

export type NewProspectCompany = {
  readonly name: string;
  readonly department: string;
  readonly city?: string;
  readonly postalCode?: string;
  readonly phone?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly activity?: string;
};

export type NewProspectContact = {
  readonly firstName?: string;
  readonly lastName: string;
  readonly jobTitle?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly isLeader?: boolean;
  readonly isMain?: boolean;
};

const PROSPECTS_API = "/api/admin/prospects";

export const uniqueToken = () =>
  crypto
    .randomUUID()
    .replaceAll(/[^a-f]/g, "")
    .slice(0, 8)
    .padEnd(8, "x");

export const createProspectCompany = async (page: Page, company: NewProspectCompany) => {
  const response = await page.request.post(`${PROSPECTS_API}/companies`, { data: company });
  expect(response.status()).toBe(201);
  return createdRecord.parse(await response.json()).id;
};

export const changeProspectStage = async (page: Page, companyId: string, stage: ProspectStage) => {
  const response = await page.request.post(`${PROSPECTS_API}/companies/${companyId}/stage`, {
    data: { stage },
  });
  expect(response.status()).toBe(204);
};

export const addProspectContact = async (
  page: Page,
  companyId: string,
  contact: NewProspectContact,
) => {
  const response = await page.request.post(`${PROSPECTS_API}/companies/${companyId}/contacts`, {
    data: contact,
  });
  expect(response.status()).toBe(201);
  return createdRecord.parse(await response.json()).id;
};

export const blockMapTiles = async (context: BrowserContext) => {
  await context.route("https://data.geopf.fr/**", (route) => route.abort());
};
