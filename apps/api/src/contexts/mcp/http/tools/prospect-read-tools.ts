import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CONTACT_FILTERS, DEPARTMENT_PATTERN, PROSPECT_STAGES } from "@passalio/shared";
import * as z from "zod";
import {
  createSalesDependencies,
  getCompanyFile,
  getContactFile,
  getProspectFilters,
  listCompanies,
  listContacts,
} from "../../../sales";
import { pageFields } from "./admin-tools";
import { errorResult, jsonResult, runTool, type McpToolContext } from "./tool-context";
import { toolsFr } from "./tools-fr";

const { fields, tools } = toolsFr;

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

const department = z.string().regex(DEPARTMENT_PATTERN).optional().describe(fields.department);
const search = z.string().trim().max(120).optional().describe(fields.search);

const listCompaniesInput = z.object({
  stage: z.enum(PROSPECT_STAGES).optional().describe(fields.stage),
  department,
  owner: z.string().min(1).max(100).optional().describe(fields.owner),
  search,
  ...pageFields,
});

const listContactsInput = z.object({
  filter: z.enum(CONTACT_FILTERS).default("all").describe(fields.contactFilter),
  department,
  search,
  ...pageFields,
});

export const companyIdInput = z.object({ companyId: z.uuid().describe(fields.companyId) });

export const contactIdInput = z.object({ contactId: z.uuid().describe(fields.contactId) });

export const registerProspectReadTools = (server: McpServer, context: McpToolContext) => {
  const dependencies = createSalesDependencies(context.database, context.auditTrail);
  server.registerTool(
    "get_prospect_filters",
    { ...tools.get_prospect_filters, annotations: READ_ONLY },
    async () =>
      runTool(context, "get_prospect_filters", async () =>
        jsonResult(await getProspectFilters(dependencies)(context.actor)),
      ),
  );
  server.registerTool(
    "list_prospect_companies",
    { ...tools.list_prospect_companies, inputSchema: listCompaniesInput, annotations: READ_ONLY },
    async ({ owner, search: query, ...input }) =>
      runTool(context, "list_prospect_companies", async () =>
        jsonResult(
          await listCompanies(dependencies)(context.actor, { ...input, ownerUserId: owner, query }),
        ),
      ),
  );
  server.registerTool(
    "get_prospect_company",
    { ...tools.get_prospect_company, inputSchema: companyIdInput, annotations: READ_ONLY },
    async ({ companyId }) =>
      runTool(context, "get_prospect_company", async () => {
        const result = await getCompanyFile(dependencies)(context.actor, companyId);
        return result.isOk ? jsonResult(result.value) : errorResult(result.error);
      }),
  );
  server.registerTool(
    "list_prospect_contacts",
    { ...tools.list_prospect_contacts, inputSchema: listContactsInput, annotations: READ_ONLY },
    async ({ search: query, ...input }) =>
      runTool(context, "list_prospect_contacts", async () =>
        jsonResult(await listContacts(dependencies)(context.actor, { ...input, query })),
      ),
  );
  server.registerTool(
    "get_prospect_contact",
    { ...tools.get_prospect_contact, inputSchema: contactIdInput, annotations: READ_ONLY },
    async ({ contactId }) =>
      runTool(context, "get_prospect_contact", async () => {
        const result = await getContactFile(dependencies)(context.actor, contactId);
        return result.isOk ? jsonResult(result.value) : errorResult(result.error);
      }),
  );
};
