import { syncPushResult, type SyncPushBody } from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "../api-client";
import { customerRecord, equipmentRecord, photoRecord, siteRecord } from "../db/local-records";
import { documentRecord, interventionRecord } from "../db/planning-records";

const pushResponse = z.object({ results: z.array(syncPushResult) });

const pullResponse = z.object({
  changes: z.object({
    customers: z.array(customerRecord),
    sites: z.array(siteRecord),
    equipments: z.array(equipmentRecord),
    photos: z.array(photoRecord),
    interventions: z.array(interventionRecord).optional(),
    documents: z.array(documentRecord).optional(),
  }),
  cursor: z.string(),
  hasMore: z.boolean(),
});

export type PulledChanges = z.infer<typeof pullResponse>;

export const pushMutations = (mutations: SyncPushBody["mutations"]) =>
  apiRequest("/sync/push", pushResponse, { method: "POST", body: { mutations } });

export const pullChanges = (cursor: string | undefined) =>
  apiRequest(
    cursor === undefined ? "/sync/pull" : `/sync/pull?cursor=${encodeURIComponent(cursor)}`,
    pullResponse,
  );

export type PhotoUpload = {
  readonly id: string;
  readonly equipmentId: string;
  readonly kind: string;
  readonly takenAt: string;
  readonly blob: Blob;
};

export const uploadPhoto = ({ id, equipmentId, kind, takenAt, blob }: PhotoUpload) =>
  apiRequest(
    `/equipments/${equipmentId}/photos?${new URLSearchParams({ id, kind, takenAt }).toString()}`,
    z.unknown(),
    { method: "POST", file: blob },
  );
