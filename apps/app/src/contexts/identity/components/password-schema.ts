import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@passalio/shared";
import * as z from "zod";
import { identityFr } from "../fr";

export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { error: identityFr.fields.passwordTooShort })
  .max(MAX_PASSWORD_LENGTH, { error: identityFr.fields.passwordTooLong });
