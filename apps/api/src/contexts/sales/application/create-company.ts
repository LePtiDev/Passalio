import {
  assertPlatformCan,
  type PlatformActor,
  type ProspectCompanyFields,
  type ProspectCompanyResponse,
} from "@passalio/shared";
import type { ProspectCompany } from "../domain/prospect-models";
import type { SalesDependencies } from "../domain/prospect-ports";
import { companySearchName, companySearchText } from "../domain/prospect-rules";
import { companyResponse } from "./prospect-serializers";

export const newProspectCompany = (
  fields: ProspectCompanyFields,
  { id, at }: { readonly id: string; readonly at: Date },
): ProspectCompany => ({
  id,
  name: fields.name,
  searchName: companySearchName(fields.name),
  searchText: companySearchText(fields),
  legalName: fields.legalName ?? null,
  siren: fields.siren ?? null,
  nafCode: fields.nafCode ?? null,
  legalForm: fields.legalForm ?? null,
  address: fields.address ?? null,
  postalCode: fields.postalCode ?? null,
  city: fields.city ?? null,
  department: fields.department,
  latitude: fields.latitude ?? null,
  longitude: fields.longitude ?? null,
  phone: fields.phone ?? null,
  email: fields.email ?? null,
  website: fields.website ?? null,
  activity: fields.activity ?? null,
  headcount: fields.headcount ?? null,
  currentTool: fields.currentTool ?? null,
  foundedOn: null,
  registryStatus: null,
  notes: fields.notes ?? null,
  stage: "to_qualify",
  ownerUserId: null,
  sourceRef: null,
  createdAt: at,
  updatedAt: at,
});

export const createCompany =
  ({ companies, now, newId }: Pick<SalesDependencies, "companies" | "now" | "newId">) =>
  async (actor: PlatformActor, fields: ProspectCompanyFields): Promise<ProspectCompanyResponse> => {
    assertPlatformCan(actor, "prospects:write");
    const company = newProspectCompany(fields, { id: newId(), at: now() });
    await companies.create(company);
    return companyResponse(company, null);
  };
