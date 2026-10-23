import * as z from "zod";

export const PROSPECT_STAGES = [
  "to_qualify",
  "qualified",
  "interested",
  "demo_planned",
  "customer",
  "not_interested",
] as const;

export type ProspectStage = (typeof PROSPECT_STAGES)[number];

export const PROSPECT_EVENT_KINDS = ["note", "stage_changed"] as const;

export type ProspectEventKind = (typeof PROSPECT_EVENT_KINDS)[number];

export const CONTACT_FILTERS = ["all", "leaders", "no_phone"] as const;

export type ContactFilter = (typeof CONTACT_FILTERS)[number];

export const DEPARTMENT_PATTERN = /^(\d{2}|2A|2B|97\d)$/;

export const PROSPECT_NOTE_MAX_LENGTH = 2000;

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => text(max).nullable().optional();

export const prospectCompanyFields = z.object({
  name: text(160),
  legalName: optionalText(160),
  siren: z
    .string()
    .regex(/^\d{9}$/)
    .nullable()
    .optional(),
  nafCode: optionalText(10),
  legalForm: optionalText(80),
  address: optionalText(200),
  postalCode: z
    .string()
    .regex(/^\d{5}$/)
    .nullable()
    .optional(),
  city: optionalText(100),
  department: z.string().regex(DEPARTMENT_PATTERN),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  phone: optionalText(30),
  email: z.email().max(200).nullable().optional(),
  website: optionalText(200),
  activity: optionalText(300),
  headcount: optionalText(60),
  notes: optionalText(PROSPECT_NOTE_MAX_LENGTH),
});

export type ProspectCompanyFields = z.infer<typeof prospectCompanyFields>;

export const prospectCompanyChanges = prospectCompanyFields
  .partial()
  .extend({ ownerUserId: z.string().min(1).nullable().optional() })
  .refine((changes) => Object.keys(changes).length > 0);

export type ProspectCompanyChanges = z.infer<typeof prospectCompanyChanges>;

export const prospectContactFields = z.object({
  firstName: optionalText(80),
  lastName: text(80),
  jobTitle: optionalText(80),
  isLeader: z.boolean().optional(),
  isMain: z.boolean().optional(),
  phone: optionalText(30),
  mobile: optionalText(30),
  email: z.email().max(200).nullable().optional(),
  bestTime: optionalText(120),
});

export type ProspectContactFields = z.infer<typeof prospectContactFields>;

export const prospectContactChanges = prospectContactFields
  .partial()
  .refine((changes) => Object.keys(changes).length > 0);

export type ProspectContactChanges = z.infer<typeof prospectContactChanges>;

export const prospectStageChange = z.object({ stage: z.enum(PROSPECT_STAGES) });

export const prospectNote = z.object({
  body: text(PROSPECT_NOTE_MAX_LENGTH),
  contactId: z.string().min(1).nullable().optional(),
});

export type ProspectNote = z.infer<typeof prospectNote>;
