import * as z from "zod";
import { CONTACT_FILTERS, PROSPECT_EVENT_KINDS, PROSPECT_STAGES } from "./prospects";

const stage = z.enum(PROSPECT_STAGES);
const person = z.object({ id: z.string(), name: z.string() });

export const prospectCompanyCountsResponse = z.object({
  all: z.number(),
  to_qualify: z.number(),
  qualified: z.number(),
  interested: z.number(),
  demo_planned: z.number(),
  customer: z.number(),
  not_interested: z.number(),
}) satisfies z.ZodType<Record<"all" | (typeof PROSPECT_STAGES)[number], number>>;

export const prospectCompanySummaryResponse = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  department: z.string(),
  phone: z.string().nullable(),
  stage,
  owner: person.nullable(),
  mainContact: person.nullable(),
});

export const prospectCompaniesPageResponse = z.object({
  companies: z.array(prospectCompanySummaryResponse),
  counts: prospectCompanyCountsResponse,
  nextCursor: z.string().nullable(),
});

export const prospectCompanyResponse = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string().nullable(),
  siren: z.string().nullable(),
  nafCode: z.string().nullable(),
  legalForm: z.string().nullable(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  department: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  activity: z.string().nullable(),
  headcount: z.string().nullable(),
  currentTool: z.string().nullable(),
  foundedOn: z.string().nullable(),
  registryStatus: z.string().nullable(),
  notes: z.string().nullable(),
  stage,
  owner: person.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const prospectContactResponse = z.object({
  id: z.string(),
  companyId: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string(),
  name: z.string(),
  jobTitle: z.string().nullable(),
  isLeader: z.boolean(),
  isMain: z.boolean(),
  phone: z.string().nullable(),
  mobile: z.string().nullable(),
  email: z.string().nullable(),
  bestTime: z.string().nullable(),
});

export const prospectEventResponse = z.object({
  id: z.string(),
  kind: z.enum(PROSPECT_EVENT_KINDS),
  body: z.string().nullable(),
  fromStage: stage.nullable(),
  toStage: stage.nullable(),
  createdAt: z.string(),
  authorName: z.string().nullable(),
  contact: person.nullable(),
});

export const prospectCompanyFileResponse = z.object({
  company: prospectCompanyResponse,
  contacts: z.array(prospectContactResponse),
  events: z.array(prospectEventResponse),
});

export const prospectContactSummaryResponse = z.object({
  id: z.string(),
  name: z.string(),
  jobTitle: z.string().nullable(),
  isLeader: z.boolean(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  company: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string().nullable(),
    department: z.string(),
  }),
});

export const prospectContactsPageResponse = z.object({
  contacts: z.array(prospectContactSummaryResponse),
  counts: z.object({
    all: z.number(),
    leaders: z.number(),
    no_phone: z.number(),
  }) satisfies z.ZodType<Record<(typeof CONTACT_FILTERS)[number], number>>,
  nextCursor: z.string().nullable(),
});

export const prospectContactFileResponse = z.object({
  contact: prospectContactResponse,
  company: prospectCompanySummaryResponse,
  events: z.array(prospectEventResponse),
});

export const prospectMapResponse = z.object({
  pins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      city: z.string().nullable(),
      phone: z.string().nullable(),
      stage,
      latitude: z.number(),
      longitude: z.number(),
    }),
  ),
});

export const prospectFiltersResponse = z.object({
  departments: z.array(z.object({ code: z.string(), count: z.number() })),
  owners: z.array(person),
  totals: z.object({ companies: z.number(), contacts: z.number() }),
});

export type ProspectCompaniesPageResponse = z.infer<typeof prospectCompaniesPageResponse>;
export type ProspectCompanyCountsResponse = z.infer<typeof prospectCompanyCountsResponse>;
export type ProspectCompanySummaryResponse = z.infer<typeof prospectCompanySummaryResponse>;
export type ProspectCompanyResponse = z.infer<typeof prospectCompanyResponse>;
export type ProspectContactResponse = z.infer<typeof prospectContactResponse>;
export type ProspectEventResponse = z.infer<typeof prospectEventResponse>;
export type ProspectCompanyFileResponse = z.infer<typeof prospectCompanyFileResponse>;
export type ProspectContactSummaryResponse = z.infer<typeof prospectContactSummaryResponse>;
export type ProspectContactsPageResponse = z.infer<typeof prospectContactsPageResponse>;
export type ProspectContactFileResponse = z.infer<typeof prospectContactFileResponse>;
export type ProspectMapResponse = z.infer<typeof prospectMapResponse>;
export type ProspectFiltersResponse = z.infer<typeof prospectFiltersResponse>;
