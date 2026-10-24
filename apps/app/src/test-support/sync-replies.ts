import type { PulledChanges } from "@/lib/sync/sync-api";
import { jsonReply, type FakeReply } from "./fake-api";

type Changes = PulledChanges["changes"];

export const SYNC_PULL_ROUTE = "GET /api/sync/pull";

export const pulledChangesReply = (changes: Partial<Changes> = {}): FakeReply => {
  const body: PulledChanges = {
    changes: { customers: [], sites: [], equipments: [], photos: [], ...changes },
    cursor: "cursor-1",
    hasMore: false,
  };
  return jsonReply(body);
};
