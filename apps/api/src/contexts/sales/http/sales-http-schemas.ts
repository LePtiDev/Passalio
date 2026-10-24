import {
  CALL_SERIES_TARGETS,
  CONTACT_FILTERS,
  DEPARTMENT_PATTERN,
  PROSPECT_STAGES,
} from "@passalio/shared";
import * as z from "zod";

export const companyParams = z.object({ companyId: z.uuid() });
export const contactParams = z.object({ contactId: z.uuid() });
export const taskParams = z.object({ taskId: z.uuid() });

const department = z.string().regex(DEPARTMENT_PATTERN).optional();
const search = z.string().trim().max(120).optional();
const cursor = z.string().max(300).optional();
const limit = z.coerce.number().int().min(5).max(50).optional();

export const listCompaniesQuery = z.object({
  stage: z.enum(PROSPECT_STAGES).optional(),
  department,
  owner: z.string().min(1).max(100).optional(),
  q: search,
  cursor,
  limit,
});

export const listContactsQuery = z.object({
  filter: z.enum(CONTACT_FILTERS).default("all"),
  department,
  q: search,
  cursor,
  limit,
});

export const mapQuery = z.object({ department, stage: z.enum(PROSPECT_STAGES).optional() });

export const callSeriesQuery = z.object({
  target: z.enum(CALL_SERIES_TARGETS).default("never_called"),
  department,
  cursor,
  limit,
});
