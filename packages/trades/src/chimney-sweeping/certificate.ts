import { CALENDAR_DATE_PATTERN } from "@passalio/shared";
import * as z from "zod";
import { ENERGIES, EQUIPMENT_KINDS } from "../equipment-catalog";
import { FLUE_TYPES } from "../equipment-details";

export const CERTIFICATE_TEMPLATE_VERSION = 1;

export const LEGAL_FORMS = ["ei", "eurl", "sarl", "sasu", "sas", "sa", "other"] as const;

export type LegalForm = (typeof LEGAL_FORMS)[number];

export const REGISTRY_KINDS = ["rcs", "rne"] as const;

export type RegistryKind = (typeof REGISTRY_KINDS)[number];

export const COMPANY_TEXT_MAX_LENGTH = 120;

export const COMPANY_ADDRESS_MAX_LENGTH = 2000;

export const SWEEPING_EXTENTS = ["full_length", "partial", "sealed_appliance"] as const;

export type SweepingExtent = (typeof SWEEPING_EXTENTS)[number];

export const CHIMNEY_STACK_STATES = ["good", "needs_repair", "not_checked"] as const;

export const SIGNATURE_MAX_LENGTH = 300_000;

const SHORT_TEXT = COMPANY_TEXT_MAX_LENGTH;
const LONG_TEXT = COMPANY_ADDRESS_MAX_LENGTH;

const text = (maxLength: number) => z.string().trim().min(1).max(maxLength);
const optionalText = (maxLength: number) => z.string().trim().max(maxLength).nullable();
const calendarDate = z.string().regex(CALENDAR_DATE_PATTERN);
const signature = z
  .string()
  .max(SIGNATURE_MAX_LENGTH)
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);

const registry = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rcs"), city: text(SHORT_TEXT) }),
  z.object({ kind: z.literal("rne") }),
]);

export const chimneySweepingCertificate = z.strictObject({
  company: z.strictObject({
    name: text(SHORT_TEXT),
    legalForm: z.enum(LEGAL_FORMS),
    shareCapitalEuros: z.int().min(1).nullable(),
    siren: z.string().regex(/^\d{9}$/),
    registry,
    address: text(LONG_TEXT),
    phone: optionalText(SHORT_TEXT),
    qualification: optionalText(SHORT_TEXT),
  }),
  customer: z.strictObject({ name: text(SHORT_TEXT), address: text(LONG_TEXT) }),
  site: z.strictObject({ address: text(LONG_TEXT), room: optionalText(SHORT_TEXT) }),
  equipment: z.strictObject({
    kind: z.enum(EQUIPMENT_KINDS),
    energy: z.enum(ENERGIES).nullable(),
    brand: optionalText(SHORT_TEXT),
    model: optionalText(SHORT_TEXT),
    serialNumber: optionalText(SHORT_TEXT),
    flueType: z.enum(FLUE_TYPES).nullable(),
  }),
  technician: z.strictObject({ name: text(SHORT_TEXT) }),
  flues: z
    .array(z.strictObject({ designation: text(SHORT_TEXT) }))
    .min(1)
    .max(10),
  sweepingExtent: z.enum(SWEEPING_EXTENTS),
  unsweptPart: optionalText(LONG_TEXT),
  isConnectionPipeSwept: z.boolean(),
  chimneyStacks: z.enum(CHIMNEY_STACK_STATES),
  anomalies: optionalText(LONG_TEXT),
  isDoNotUse: z.boolean(),
  visitedOn: calendarDate,
  completedOn: calendarDate,
  lastSweepingOn: calendarDate.nullable(),
  lastServiceOn: calendarDate.nullable(),
  isAdviceAttached: z.boolean(),
  technicianSignature: signature,
  customerSignature: signature.nullable(),
  isCustomerAbsent: z.boolean(),
});

export type ChimneySweepingCertificate = z.infer<typeof chimneySweepingCertificate>;

export type CertificateCompany = ChimneySweepingCertificate["company"];
