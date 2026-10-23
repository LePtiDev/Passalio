import type { ProspectContactFields, ProspectContactResponse } from "@passalio/shared";
import * as z from "zod";
import { salesFr } from "../../fr";

const errors = salesFr.contactForm.errors;

const optional = (max: number) => z.string().trim().max(max);

export const contactFormSchema = z.object({
  companyId: z.string().min(1, errors.company),
  firstName: optional(80),
  lastName: z.string().trim().min(1, errors.lastName).max(80),
  jobTitle: optional(80),
  phone: optional(30),
  mobile: optional(30),
  email: z.union([z.literal(""), z.email(errors.email).max(200)]),
  bestTime: optional(120),
  isLeader: z.boolean(),
  isMain: z.boolean(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

const orNull = (value: string) => (value === "" ? null : value);

export const emptyContactForm = (companyId: string | null): ContactFormValues => ({
  companyId: companyId ?? "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  phone: "",
  mobile: "",
  email: "",
  bestTime: "",
  isLeader: false,
  isMain: false,
});

export const contactFormOf = (contact: ProspectContactResponse): ContactFormValues => ({
  companyId: contact.companyId,
  firstName: contact.firstName ?? "",
  lastName: contact.lastName,
  jobTitle: contact.jobTitle ?? "",
  phone: contact.phone ?? "",
  mobile: contact.mobile ?? "",
  email: contact.email ?? "",
  bestTime: contact.bestTime ?? "",
  isLeader: contact.isLeader,
  isMain: contact.isMain,
});

export const toContactFields = (values: ContactFormValues): ProspectContactFields => ({
  firstName: orNull(values.firstName),
  lastName: values.lastName,
  jobTitle: orNull(values.jobTitle),
  phone: orNull(values.phone),
  mobile: orNull(values.mobile),
  email: orNull(values.email),
  bestTime: orNull(values.bestTime),
  isLeader: values.isLeader,
  isMain: values.isMain,
});
