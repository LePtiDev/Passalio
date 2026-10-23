import * as z from "zod";
import { ACCOUNT_FILTERS } from "../domain/backoffice-ports";

export const accountParams = z.object({ organizationId: z.uuid() });

const limit = z.coerce.number().int().min(5).max(50).optional();

export const listAccountsQuery = z.object({
  filter: z.enum(ACCOUNT_FILTERS).default("all"),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().max(300).optional(),
  limit,
});

export const journalQuery = z.object({ cursor: z.string().max(100).optional(), limit });
