import { TEAM_SIZES } from "@passalio/shared";
import * as z from "zod";
import { onboardingFr } from "../../onboarding-fr";

const text = onboardingFr.company;

export const companyFormSchema = z.object({
  name: z.string().trim().min(2, { error: text.nameInvalid }).max(100, { error: text.nameInvalid }),
  siret: z
    .string()
    .transform((value) => value.replaceAll(/\s/g, ""))
    .refine((value) => value === "" || /^\d{14}$/.test(value), { error: text.siretInvalid }),
  address: z.string().trim().max(300),
  phone: z.string().trim().max(30),
  teamSize: z.enum(TEAM_SIZES).nullable(),
});

export type CompanyFormInput = z.input<typeof companyFormSchema>;
export type CompanyFormValues = z.output<typeof companyFormSchema>;
