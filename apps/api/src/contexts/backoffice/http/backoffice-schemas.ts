import * as z from "zod";
import { ACCOUNT_FILTERS } from "../domain/backoffice-ports";

export const accountParams = z.object({ organizationId: z.uuid() });

export const listAccountsQuery = z.object({
  filter: z.enum(ACCOUNT_FILTERS).default("all"),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().max(300).optional(),
});

export const journalQuery = z.object({ cursor: z.string().max(100).optional() });
