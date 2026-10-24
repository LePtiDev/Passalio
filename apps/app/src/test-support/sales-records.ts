import type {
  ProspectCompaniesPageResponse,
  ProspectCompanyCountsResponse,
  ProspectCompanyFileResponse,
  ProspectCompanyResponse,
  ProspectCompanySummaryResponse,
  ProspectContactFileResponse,
  ProspectContactResponse,
  ProspectContactsPageResponse,
  ProspectContactSummaryResponse,
  ProspectEventResponse,
  ProspectFiltersResponse,
  ProspectMapResponse,
} from "@passalio/shared";

export const companyCounts = (
  overrides: Partial<ProspectCompanyCountsResponse> = {},
): ProspectCompanyCountsResponse => ({
  all: 0,
  to_qualify: 0,
  qualified: 0,
  interested: 0,
  demo_planned: 0,
  customer: 0,
  not_interested: 0,
  ...overrides,
});

export const companySummary = (
  id: string,
  name: string,
  overrides: Partial<ProspectCompanySummaryResponse> = {},
): ProspectCompanySummaryResponse => ({
  id,
  name,
  city: "Créteil",
  department: "94",
  phone: "01 45 67 89 10",
  stage: "to_qualify",
  owner: null,
  mainContact: null,
  ...overrides,
});

export const companiesPage = (
  overrides: Partial<ProspectCompaniesPageResponse> = {},
): ProspectCompaniesPageResponse => ({
  companies: [],
  counts: companyCounts(),
  nextCursor: null,
  ...overrides,
});

export const prospectFilters = (
  overrides: Partial<ProspectFiltersResponse> = {},
): ProspectFiltersResponse => ({
  departments: [
    { code: "94", count: 12 },
    { code: "75", count: 4 },
  ],
  owners: [{ id: "owner-1", name: "Léa Commerciale" }],
  totals: { companies: 16, contacts: 9 },
  ...overrides,
});

export const prospectCompany = (
  id: string,
  name: string,
  overrides: Partial<ProspectCompanyResponse> = {},
): ProspectCompanyResponse => ({
  id,
  name,
  legalName: null,
  siren: "123456789",
  nafCode: null,
  legalForm: null,
  address: "3 avenue du Général de Gaulle",
  postalCode: "94000",
  city: "Créteil",
  department: "94",
  latitude: null,
  longitude: null,
  phone: "01 45 67 89 10",
  email: null,
  website: "https://www.ramonage-creteil.test/",
  activity: "Ramonage",
  headcount: null,
  currentTool: null,
  foundedOn: null,
  registryStatus: null,
  notes: null,
  stage: "to_qualify",
  owner: { id: "owner-1", name: "Léa Commerciale" },
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-01T08:00:00.000Z",
  ...overrides,
});

export const prospectContact = (
  id: string,
  companyId: string,
  lastName: string,
  overrides: Partial<ProspectContactResponse> = {},
): ProspectContactResponse => ({
  id,
  companyId,
  firstName: "Jean",
  lastName,
  name: `Jean ${lastName}`,
  jobTitle: "Gérant",
  isLeader: true,
  isMain: true,
  phone: "06 12 34 56 78",
  mobile: null,
  email: null,
  bestTime: null,
  ...overrides,
});

export const prospectNoteEvent = (
  id: string,
  body: string,
  overrides: Partial<ProspectEventResponse> = {},
): ProspectEventResponse => ({
  id,
  kind: "note",
  body,
  fromStage: null,
  toStage: null,
  createdAt: "2026-10-10T09:00:00.000Z",
  authorName: "Léa Commerciale",
  contact: null,
  ...overrides,
});

export const companyFile = (
  company: ProspectCompanyResponse,
  overrides: Partial<ProspectCompanyFileResponse> = {},
): ProspectCompanyFileResponse => ({ company, contacts: [], events: [], ...overrides });

export const contactSummary = (
  id: string,
  name: string,
  overrides: Partial<ProspectContactSummaryResponse> = {},
): ProspectContactSummaryResponse => ({
  id,
  name,
  jobTitle: "Gérant",
  isLeader: true,
  phone: "06 12 34 56 78",
  email: null,
  company: { id: "company-1", name: "Ramonage Créteil", city: "Créteil", department: "94" },
  ...overrides,
});

export const contactsPage = (
  overrides: Partial<ProspectContactsPageResponse> = {},
): ProspectContactsPageResponse => ({
  contacts: [],
  counts: { all: 0, leaders: 0, no_phone: 0 },
  nextCursor: null,
  ...overrides,
});

export const contactFile = (
  contact: ProspectContactResponse,
  company: ProspectCompanySummaryResponse,
  overrides: Partial<ProspectContactFileResponse> = {},
): ProspectContactFileResponse => ({ contact, company, events: [], ...overrides });

export const prospectMap = (pins: ProspectMapResponse["pins"] = []): ProspectMapResponse => ({
  pins,
});
