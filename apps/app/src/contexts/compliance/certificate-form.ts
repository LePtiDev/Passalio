import { CALENDAR_DATE_PATTERN } from "@passalio/shared";
import {
  CHIMNEY_STACK_STATES,
  COMPANY_ADDRESS_MAX_LENGTH,
  COMPANY_TEXT_MAX_LENGTH,
  flueApplianceDetails,
} from "@passalio/trades";
import * as z from "zod";
import { FLUE_TYPE_LABELS } from "@/contexts/customers";
import type { EquipmentRecord, InterventionRecord } from "@/lib/db/local-records";
import { complianceFr } from "./fr";

const text = complianceFr.form.errors;

export const ANOMALY_KINDS = ["soot", "leak", "damaged_flue", "accessory", "other"] as const;

export type AnomalyKind = (typeof ANOMALY_KINDS)[number];

export const FORM_EXTENTS = ["full_length", "partial"] as const;

export type FormExtent = (typeof FORM_EXTENTS)[number];

export type ChimneyStackState = (typeof CHIMNEY_STACK_STATES)[number];

const optionalDate = z.union([z.literal(""), z.string().regex(CALENDAR_DATE_PATTERN)]);

export const certificateFormValues = z.object({
  flueDesignation: z.string().max(COMPANY_TEXT_MAX_LENGTH),
  isConnectionPipeSwept: z.boolean(),
  isMechanicalSweeping: z.boolean(),
  sweepingExtent: z.enum(FORM_EXTENTS),
  unsweptPart: z.string().max(COMPANY_ADDRESS_MAX_LENGTH),
  chimneyStacks: z.enum(CHIMNEY_STACK_STATES),
  anomalyKinds: z.array(z.enum(ANOMALY_KINDS)),
  anomalyDetails: z.string().max(COMPANY_ADDRESS_MAX_LENGTH),
  isDoNotUse: z.boolean(),
  visitedOn: optionalDate,
  lastSweepingOn: optionalDate,
  lastServiceOn: optionalDate,
});

export type CertificateFormValues = z.infer<typeof certificateFormValues>;

type Issue = { readonly path: keyof CertificateFormValues; readonly message: string };

const dateIssues = (values: CertificateFormValues, today: string): readonly Issue[] => {
  if (values.visitedOn === "") {
    return [{ path: "visitedOn", message: text.visitedOn }];
  }
  const visitIssue: readonly Issue[] =
    values.visitedOn > today ? [{ path: "visitedOn", message: text.futureDate }] : [];
  const pastIssues = (["lastSweepingOn", "lastServiceOn"] as const).flatMap((path) =>
    values[path] !== "" && values[path] > values.visitedOn
      ? [{ path, message: text.afterVisit }]
      : [],
  );
  return [...visitIssue, ...pastIssues];
};

const isBlank = (value: string) => value.trim() === "";

const FIELD_RULES: readonly (readonly [
  Issue["path"],
  string,
  (values: CertificateFormValues) => boolean,
])[] = [
  ["flueDesignation", text.flue, (values) => isBlank(values.flueDesignation)],
  ["isMechanicalSweeping", text.mechanical, (values) => !values.isMechanicalSweeping],
  [
    "unsweptPart",
    text.unsweptPart,
    (values) => values.sweepingExtent === "partial" && isBlank(values.unsweptPart),
  ],
  [
    "anomalyDetails",
    text.anomalyDetails,
    (values) => values.anomalyKinds.includes("other") && isBlank(values.anomalyDetails),
  ],
];

export const certificateFormIssues = (
  values: CertificateFormValues,
  today: string,
): readonly Issue[] => [
  ...FIELD_RULES.flatMap(([path, message, isBroken]) =>
    isBroken(values) ? [{ path, message }] : [],
  ),
  ...dateIssues(values, today),
];

export const certificateFormSchema = (today: string) =>
  certificateFormValues.superRefine((values, context) => {
    certificateFormIssues(values, today).forEach(({ path, message }) =>
      context.addIssue({ code: "custom", path: [path], message }),
    );
  });

const flueDesignationOf = (equipment: EquipmentRecord) => {
  const details = flueApplianceDetails.safeParse(equipment.details);
  const flueType = details.success ? details.data.flueType : undefined;
  const location = details.success ? details.data.flueLocation : undefined;
  return [
    flueType === undefined ? "Conduit" : `Conduit ${FLUE_TYPE_LABELS[flueType].toLowerCase()}`,
    equipment.room?.toLowerCase() ?? null,
    location ?? null,
  ]
    .filter((part) => part !== null && part !== "")
    .join(", ");
};

export const initialFormValues = (
  equipment: EquipmentRecord,
  intervention: Pick<InterventionRecord, "scheduledDate">,
  today: string,
): CertificateFormValues => ({
  flueDesignation: flueDesignationOf(equipment),
  isConnectionPipeSwept: true,
  isMechanicalSweeping: true,
  sweepingExtent: "full_length",
  unsweptPart: "",
  chimneyStacks: "good",
  anomalyKinds: [],
  anomalyDetails: "",
  isDoNotUse: false,
  visitedOn: intervention.scheduledDate > today ? today : intervention.scheduledDate,
  lastSweepingOn: equipment.lastSweepingOn ?? "",
  lastServiceOn: equipment.lastServiceOn ?? "",
});
