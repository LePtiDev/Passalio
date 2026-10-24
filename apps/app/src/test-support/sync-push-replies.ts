import type { SyncPushResult } from "@passalio/shared";
import * as z from "zod";
import { jsonReply, type FakeReply, type FakeRequest } from "./fake-api";
import { createGate } from "./gate";

export const SYNC_PUSH_ROUTE = "POST /api/sync/push";

const pushedBody = z.object({
  mutations: z.array(z.object({ id: z.string(), mutation: z.object({ type: z.string() }) })),
});

export const pushedMutationTypes = (request: FakeRequest): readonly string[] =>
  pushedBody.parse(request.body).mutations.map(({ mutation }) => mutation.type);

export const pushReply =
  (rejected: Readonly<Record<string, string>> = {}) =>
  (request: FakeRequest): FakeReply =>
    jsonReply({
      results: pushedBody.parse(request.body).mutations.map(({ id, mutation }): SyncPushResult => {
        const error = rejected[mutation.type];
        return error === undefined ? { id, status: "applied" } : { id, status: "rejected", error };
      }),
    });

export const heldPushReply = (rejected: Readonly<Record<string, string>> = {}) => {
  const gate = createGate();
  return {
    reply: (request: FakeRequest): FakeReply => ({
      ...pushReply(rejected)(request),
      until: gate.opened,
    }),
    release: gate.open,
  };
};
