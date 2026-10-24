import * as z from "zod";

export const signUpSettingsResponse = z.object({
  isSignUpOpen: z.boolean(),
  changedAt: z.string().nullable(),
  changedByName: z.string().nullable(),
});

export type SignUpSettingsResponse = z.infer<typeof signUpSettingsResponse>;

export const changeSignUpSettingsBody = z.object({ isSignUpOpen: z.boolean() });

export type ChangeSignUpSettingsBody = z.infer<typeof changeSignUpSettingsBody>;

export const signUpAvailabilityResponse = z.object({ isSignUpOpen: z.boolean() });

export type SignUpAvailabilityResponse = z.infer<typeof signUpAvailabilityResponse>;
