import {
  DEPARTMENT_PATTERN,
  type ProspectCompanyFields,
  type ProspectCompanyResponse,
} from "@passalio/shared";
import * as z from "zod";
import { salesFr } from "../../fr";

const errors = salesFr.companyForm.errors;

const optional = (max: number) => z.string().trim().max(max);

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, errors.name).max(160),
  address: optional(200),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, errors.postalCode),
  city: optional(100),
  department: z.string().trim().toUpperCase().regex(DEPARTMENT_PATTERN, errors.department),
  phone: optional(30),
  email: z.union([z.literal(""), z.email(errors.email).max(200)]),
  website: optional(200),
  activity: optional(300),
  headcount: optional(60),
  currentTool: optional(120),
  siren: z
    .string()
    .trim()
    .regex(/^(\d{9})?$/, errors.siren),
  ownerUserId: z.string(),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

const orNull = (value: string) => (value === "" ? null : value);

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
  name: "",
  address: "",
  postalCode: "",
  city: "",
  department: "",
  phone: "",
  email: "",
  website: "",
  activity: "",
  headcount: "",
  currentTool: "",
  siren: "",
  ownerUserId: "",
};

export const companyFormOf = (company: ProspectCompanyResponse): CompanyFormValues => ({
  name: company.name,
  address: company.address ?? "",
  postalCode: company.postalCode ?? "",
  city: company.city ?? "",
  department: company.department,
  phone: company.phone ?? "",
  email: company.email ?? "",
  website: company.website ?? "",
  activity: company.activity ?? "",
  headcount: company.headcount ?? "",
  currentTool: company.currentTool ?? "",
  siren: company.siren ?? "",
  ownerUserId: company.owner?.id ?? "",
});

export const toCompanyFields = (values: CompanyFormValues): ProspectCompanyFields => ({
  name: values.name,
  address: orNull(values.address),
  postalCode: orNull(values.postalCode),
  city: orNull(values.city),
  department: values.department,
  phone: orNull(values.phone),
  email: orNull(values.email),
  website: orNull(values.website),
  activity: orNull(values.activity),
  headcount: orNull(values.headcount),
  currentTool: orNull(values.currentTool),
  siren: orNull(values.siren),
});

export const ownerOf = (values: CompanyFormValues) => orNull(values.ownerUserId);
