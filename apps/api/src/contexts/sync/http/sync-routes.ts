import { syncPushBody, type SyncPushResult } from "@passalio/shared";
import { Hono } from "hono";
import * as z from "zod";
import { syncWriteGateOf } from "../../billing";
import { requireActor, type ActorEnv } from "../../identity";
import { validateJson, validateQuery } from "../../../platform/validation";
import { decodeSyncCursor, encodeSyncCursor } from "./sync-cursor";
import { syncMutationApplier } from "./sync-mutation-router";
import { pullSyncChanges } from "./sync-pull";

const pullQuery = z.object({ cursor: z.string().max(2000).optional() });

export const syncRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .post("/sync/push", validateJson(syncPushBody), async (context) => {
    const apply = syncMutationApplier(context.var, context.env);
    const actor = context.get("actor");
    const isWriteAllowed = await syncWriteGateOf(context.var, context.env, actor.organizationId);
    const results = await context.req
      .valid("json")
      .mutations.reduce<Promise<SyncPushResult[]>>(async (previous, { id, mutation }) => {
        const applied = [...(await previous)];
        if (!isWriteAllowed(mutation)) {
          return [...applied, { id, status: "rejected", error: "workspace_blocked" }];
        }
        const result = await apply(actor, mutation);
        return [
          ...applied,
          result.isOk ? { id, status: "applied" } : { id, status: "rejected", error: result.error },
        ];
      }, Promise.resolve([]));
    const rejected = results.filter(({ status }) => status === "rejected").length;
    if (rejected > 0) {
      context.get("logger").warn({ event: "sync_mutations_rejected", rejected });
    }
    return context.json({ results });
  })
  .get("/sync/pull", validateQuery(pullQuery), async (context) => {
    const cursors = decodeSyncCursor(context.req.valid("query").cursor);
    if (cursors === undefined) {
      return context.json({ error: "invalid_request", traceId: context.get("traceId") }, 400);
    }
    const page = await pullSyncChanges(context.var, context.env)(context.get("actor"), cursors);
    return context.json({
      changes: page.changes,
      cursor: encodeSyncCursor(page.cursors),
      hasMore: page.hasMore,
    });
  });
