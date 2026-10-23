import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  PROSPECT_NOTE_MAX_LENGTH,
  PROSPECT_STAGES,
  prospectCompanyChanges,
  prospectCompanyFields,
  prospectContactChanges,
  prospectContactFields,
  type Result,
} from "@passalio/shared";
import * as z from "zod";
import {
  addCompanyNote,
  addContact,
  changeCompanyStage,
  createCompany,
  createSalesDependencies,
  updateCompany,
  updateContact,
  type ProspectError,
} from "../../../sales";
import { companyIdInput, contactIdInput } from "./prospect-read-tools";
import { errorResult, jsonResult, runTool, type McpToolContext } from "./tool-context";
import { toolsFr, type McpToolName } from "./tools-fr";

const { fields, tools } = toolsFr;

const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;

const noteBody = z.string().trim().min(1).max(PROSPECT_NOTE_MAX_LENGTH);

const updateCompanyInput = companyIdInput.extend({
  changes: prospectCompanyChanges.describe(fields.changes),
});

const stageInput = companyIdInput.extend({
  stage: z.enum(PROSPECT_STAGES).describe(fields.stage),
  note: noteBody.optional().describe(fields.note),
});

const noteInput = companyIdInput.extend({
  body: noteBody.describe(fields.noteBody),
  contactId: z.uuid().optional().describe(fields.noteContactId),
});

const addContactInput = companyIdInput.extend({
  contact: prospectContactFields.describe(fields.contact),
});

const updateContactInput = contactIdInput.extend({
  changes: prospectContactChanges.describe(fields.changes),
});

type AuditedTarget = {
  readonly type: "prospect_company" | "prospect_contact";
  readonly id: string;
  readonly data?: Readonly<Record<string, string>>;
};

export const registerProspectWriteTools = (server: McpServer, context: McpToolContext) => {
  const dependencies = createSalesDependencies(context.database, context.auditTrail);
  const audited = async (tool: McpToolName, target: AuditedTarget, value: unknown) => {
    await context.auditTrail.record({
      organizationId: null,
      actorUserId: context.actor.userId,
      action: `mcp.${tool}`,
      targetType: target.type,
      targetId: target.id,
      data: target.data ?? {},
    });
    return jsonResult(value);
  };
  const auditedResult = async <Value>(
    tool: McpToolName,
    target: AuditedTarget,
    result: Result<Value, ProspectError>,
  ): Promise<CallToolResult> =>
    result.isOk ? audited(tool, target, result.value ?? { ok: true }) : errorResult(result.error);

  server.registerTool(
    "create_prospect_company",
    { ...tools.create_prospect_company, inputSchema: prospectCompanyFields, annotations: WRITE },
    async (fieldsInput) =>
      runTool(context, "create_prospect_company", async () => {
        const company = await createCompany(dependencies)(context.actor, fieldsInput);
        return audited(
          "create_prospect_company",
          { type: "prospect_company", id: company.id, data: { company: company.name } },
          company,
        );
      }),
  );
  server.registerTool(
    "update_prospect_company",
    { ...tools.update_prospect_company, inputSchema: updateCompanyInput, annotations: WRITE },
    async ({ companyId, changes }) =>
      runTool(context, "update_prospect_company", async () =>
        auditedResult(
          "update_prospect_company",
          { type: "prospect_company", id: companyId },
          await updateCompany(dependencies)(context.actor, companyId, changes),
        ),
      ),
  );
  server.registerTool(
    "change_prospect_stage",
    { ...tools.change_prospect_stage, inputSchema: stageInput, annotations: WRITE },
    async ({ companyId, stage, note }) =>
      runTool(context, "change_prospect_stage", async () => {
        const changed = await changeCompanyStage(dependencies)(context.actor, companyId, stage);
        const noted =
          changed.isOk && note !== undefined
            ? await addCompanyNote(dependencies)(context.actor, companyId, { body: note })
            : changed;
        return auditedResult(
          "change_prospect_stage",
          { type: "prospect_company", id: companyId, data: { stage } },
          noted,
        );
      }),
  );
  server.registerTool(
    "add_prospect_note",
    { ...tools.add_prospect_note, inputSchema: noteInput, annotations: WRITE },
    async ({ companyId, body, contactId }) =>
      runTool(context, "add_prospect_note", async () =>
        auditedResult(
          "add_prospect_note",
          { type: "prospect_company", id: companyId },
          await addCompanyNote(dependencies)(context.actor, companyId, { body, contactId }),
        ),
      ),
  );
  server.registerTool(
    "add_prospect_contact",
    { ...tools.add_prospect_contact, inputSchema: addContactInput, annotations: WRITE },
    async ({ companyId, contact }) =>
      runTool(context, "add_prospect_contact", async () =>
        auditedResult(
          "add_prospect_contact",
          { type: "prospect_company", id: companyId },
          await addContact(dependencies)(context.actor, companyId, contact),
        ),
      ),
  );
  server.registerTool(
    "update_prospect_contact",
    { ...tools.update_prospect_contact, inputSchema: updateContactInput, annotations: WRITE },
    async ({ contactId, changes }) =>
      runTool(context, "update_prospect_contact", async () =>
        auditedResult(
          "update_prospect_contact",
          { type: "prospect_contact", id: contactId },
          await updateContact(dependencies)(context.actor, contactId, changes),
        ),
      ),
  );
};
