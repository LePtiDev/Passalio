import { ORGANIZATION_ROLES } from "@passalio/shared";
import * as z from "zod";
import { identityFr } from "../../fr";

const assignableRole = z.enum(ORGANIZATION_ROLES).exclude(["owner"]);

export const teamFormSchema = z.object({
  invitations: z.array(
    z.object({
      email: z
        .string()
        .trim()
        .refine((value) => value === "" || z.email().safeParse(value).success, {
          error: identityFr.fields.invalidEmail,
        }),
      role: assignableRole,
    }),
  ),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const EMPTY_INVITATION: TeamFormValues["invitations"][number] = {
  email: "",
  role: "technician",
};
