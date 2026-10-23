import { Hono } from "hono";
import { validateParam, validateQuery } from "../../../platform/validation";
import { getAccountFile } from "../application/get-account-file";
import { getAccountUsage } from "../application/get-account-usage";
import { getOverview } from "../application/get-overview";
import { listAccountMembers } from "../application/list-account-members";
import { listAccounts } from "../application/list-accounts";
import { listAccountJournal, listPlatformJournal } from "../application/list-journal";
import { createBackofficeDependencies } from "../infrastructure/backoffice-dependencies";
import { accountParams, journalQuery, listAccountsQuery } from "./backoffice-schemas";
import { requirePlatformActor, type PlatformEnv } from "./require-platform-actor";

export const backofficeRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/me", (context) => context.json({ admin: context.get("platformActor") }))
  .get("/overview", async (context) =>
    context.json(
      await getOverview(createBackofficeDependencies(context.var.database))(
        context.get("platformActor"),
      ),
    ),
  )
  .get("/accounts", validateQuery(listAccountsQuery), async (context) => {
    const { filter, q, cursor, limit } = context.req.valid("query");
    return context.json(
      await listAccounts(createBackofficeDependencies(context.var.database))(
        context.get("platformActor"),
        { filter, query: q, cursor, limit },
      ),
    );
  })
  .get("/accounts/:organizationId", validateParam(accountParams), async (context) => {
    const result = await getAccountFile(createBackofficeDependencies(context.var.database))(
      context.get("platformActor"),
      context.req.valid("param").organizationId,
    );
    return result.isOk
      ? context.json(result.value)
      : context.json({ error: result.error, traceId: context.get("traceId") }, 404);
  })
  .get("/accounts/:organizationId/members", validateParam(accountParams), async (context) => {
    const result = await listAccountMembers(createBackofficeDependencies(context.var.database))(
      context.get("platformActor"),
      context.req.valid("param").organizationId,
    );
    return result.isOk
      ? context.json(result.value)
      : context.json({ error: result.error, traceId: context.get("traceId") }, 404);
  })
  .get("/accounts/:organizationId/usage", validateParam(accountParams), async (context) => {
    const result = await getAccountUsage(createBackofficeDependencies(context.var.database))(
      context.get("platformActor"),
      context.req.valid("param").organizationId,
    );
    return result.isOk
      ? context.json(result.value)
      : context.json({ error: result.error, traceId: context.get("traceId") }, 404);
  })
  .get(
    "/accounts/:organizationId/journal",
    validateParam(accountParams),
    validateQuery(journalQuery),
    async (context) =>
      context.json(
        await listAccountJournal(createBackofficeDependencies(context.var.database))(
          context.get("platformActor"),
          { ...context.req.valid("param"), ...context.req.valid("query") },
        ),
      ),
  )
  .get("/journal", validateQuery(journalQuery), async (context) =>
    context.json(
      await listPlatformJournal(createBackofficeDependencies(context.var.database))(
        context.get("platformActor"),
        context.req.valid("query"),
      ),
    ),
  );
