import {
  BUILDING_TYPES,
  CIVILITIES,
  CUSTOMER_KINDS,
  customerFields,
  siteFields,
  type CustomerFields,
  type SiteFields,
} from "@passalio/shared";
import * as z from "zod";
import type { CustomerRecord } from "@/lib/db/local-records";
import { customersFr } from "../../fr";

const errors = customersFr.form.errors;

const MIN_PHONE_DIGITS = 10;

const text = (maxLength: number) => z.string().trim().max(maxLength);

const isPhone = (value: string) =>
  value === "" ||
  (/^\+?[\d][\d .-]*$/.test(value) && value.replaceAll(/\D/g, "").length >= MIN_PHONE_DIGITS);

const phone = text(30).refine(isPhone, { error: errors.phone });

const email = text(254).refine((value) => value === "" || z.email().safeParse(value).success, {
  error: errors.email,
});

export const siteFormSchema = z.object({
  label: text(120),
  address: text(200).min(1, { error: errors.address }),
  addressDetails: text(200),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, { error: errors.postalCode }),
  city: text(120).min(1, { error: errors.city }),
  buildingType: z.enum(BUILDING_TYPES),
  accessNotes: text(2000),
  occupantName: text(120),
  occupantPhone: phone,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const customerFormSchema = z
  .object({
    kind: z.enum(CUSTOMER_KINDS),
    civility: z.enum(CIVILITIES).nullable(),
    firstName: text(120),
    lastName: text(120),
    companyName: text(120),
    phone,
    email,
    hasDifferentBilling: z.boolean(),
    billingAddress: text(200),
    notes: text(2000),
  })
  .superRefine((values, context) => {
    if (values.kind === "individual" && values.lastName === "") {
      context.addIssue({ code: "custom", path: ["lastName"], message: errors.lastName });
    }
    if (values.kind === "company" && values.companyName === "") {
      context.addIssue({ code: "custom", path: ["companyName"], message: errors.companyName });
    }
  });

export const newCustomerFormSchema = z.object({
  customer: customerFormSchema,
  site: siteFormSchema,
});

export const siteOnlyFormSchema = z.object({ site: siteFormSchema });

export const editCustomerFormSchema = z.object({ customer: customerFormSchema });

export type SiteFormValues = z.output<typeof siteFormSchema>;
export type CustomerFormValues = z.output<typeof customerFormSchema>;
export type NewCustomerFormValues = z.output<typeof newCustomerFormSchema>;
export type SiteOnlyFormValues = z.output<typeof siteOnlyFormSchema>;
export type EditCustomerFormValues = z.output<typeof editCustomerFormSchema>;

export const emptySiteForm = (): SiteFormValues => ({
  label: "",
  address: "",
  addressDetails: "",
  postalCode: "",
  city: "",
  buildingType: "house",
  accessNotes: "",
  occupantName: "",
  occupantPhone: "",
  latitude: null,
  longitude: null,
});

export const customerFormOf = (customer: CustomerRecord | null, name = ""): CustomerFormValues => ({
  kind: customer?.kind ?? "individual",
  civility: customer?.civility ?? null,
  firstName: customer?.firstName ?? "",
  lastName: customer?.lastName ?? name,
  companyName: customer?.companyName ?? "",
  phone: customer?.phone ?? "",
  email: customer?.email ?? "",
  hasDifferentBilling: (customer?.billingAddress ?? null) !== null,
  billingAddress: customer?.billingAddress ?? "",
  notes: customer?.notes ?? "",
});

export const toCustomerFields = (values: CustomerFormValues): CustomerFields =>
  customerFields.parse({
    kind: values.kind,
    civility: values.civility,
    firstName: values.kind === "company" ? "" : values.firstName,
    lastName: values.lastName,
    companyName: values.kind === "company" ? values.companyName : "",
    phone: values.phone,
    email: values.email,
    billingAddress: values.hasDifferentBilling ? values.billingAddress : "",
    notes: values.notes,
  });

export const toSiteFields = (values: SiteFormValues): SiteFields =>
  siteFields.parse({ ...values, occupantPhone: values.occupantPhone });
