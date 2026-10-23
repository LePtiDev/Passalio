import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import {
  ACCOUNT_FILTERS,
  createBackofficeDependencies,
  getAccountFile,
  getAccountUsage,
  getOverview,
  listAccountJournal,
  listAccountMembers,
  listAccounts,
  listPlatformJournal,
} from "../../../backoffice";
import { errorResult, jsonResult, runTool, type McpToolContext } from "./tool-context";
import { toolsFr } from "./tools-fr";

const { fields, tools } = toolsFr;

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export const pageFields = {
  cursor: z.string().max(300).optional().describe(fields.cursor),
  limit: z.number().int().min(5).max(50).optional().describe(fields.limit),
};

const listAccountsInput = z.object({
  filter: z.enum(ACCOUNT_FILTERS).default("all").describe(fields.accountFilter),
  search: z.string().trim().max(120).optional().describe(fields.search),
  ...pageFields,
});

const accountInput = z.object({ accountId: z.uuid().describe(fields.accountId) });

const journalInput = z.object({
  accountId: z.uuid().optional().describe(fields.accountId),
  cursor: z.string().max(100).optional().describe(fields.cursor),
  limit: pageFields.limit,
});

export const registerAdminTools = (server: McpServer, context: McpToolContext) => {
  const dependencies = createBackofficeDependencies(context.database);
  server.registerTool("get_overview", { ...tools.get_overview, annotations: READ_ONLY }, async () =>
    runTool(context, "get_overview", async () =>
      jsonResult(await getOverview(dependencies)(context.actor)),
    ),
  );
  server.registerTool(
    "list_accounts",
    { ...tools.list_accounts, inputSchema: listAccountsInput, annotations: READ_ONLY },
    async ({ filter, search, cursor, limit }) =>
      runTool(context, "list_accounts", async () =>
        jsonResult(
          await listAccounts(dependencies)(context.actor, { filter, query: search, cursor, limit }),
        ),
      ),
  );
  server.registerTool(
    "get_account",
    { ...tools.get_account, inputSchema: accountInput, annotations: READ_ONLY },
    async ({ accountId }) =>
      runTool(context, "get_account", async () => {
        const [file, members, usage] = await Promise.all([
          getAccountFile(dependencies)(context.actor, accountId),
          listAccountMembers(dependencies)(context.actor, accountId),
          getAccountUsage(dependencies)(context.actor, accountId),
        ]);
        return file.isOk && members.isOk && usage.isOk
          ? jsonResult({ ...file.value, ...members.value, ...usage.value })
          : errorResult("account_not_found");
      }),
  );
  server.registerTool(
    "list_journal",
    { ...tools.list_journal, inputSchema: journalInput, annotations: READ_ONLY },
    async ({ accountId, cursor, limit }) =>
      runTool(context, "list_journal", async () =>
        jsonResult(
          accountId === undefined
            ? await listPlatformJournal(dependencies)(context.actor, { cursor, limit })
            : await listAccountJournal(dependencies)(context.actor, {
                organizationId: accountId,
                cursor,
                limit,
              }),
        ),
      ),
  );
};
