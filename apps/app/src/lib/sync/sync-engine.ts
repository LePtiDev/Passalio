import { err, ok, SYNC_PUSH_MAX_MUTATIONS, type Result } from "@passalio/shared";
import type { ApiError } from "../api-client";
import type { LocalDatabase } from "../db/local-database";
import type { OutboxEntry, PendingPhoto } from "../db/local-records";
import { pendingEntityIds } from "../db/outbox";
import { applyPulledChanges } from "./apply-pulled-changes";
import { pullChanges, pushMutations, uploadPhoto } from "./sync-api";
import { recordRejections } from "./sync-rejections";

export type SyncApi = {
  readonly push: typeof pushMutations;
  readonly pull: typeof pullChanges;
  readonly upload: typeof uploadPhoto;
};

const DEFAULT_API: SyncApi = { push: pushMutations, pull: pullChanges, upload: uploadPhoto };

type Stage = Promise<Result<void, ApiError>>;

const PHOTO_ALREADY_UPLOADED = "already_exists";

const pushOutbox = async (database: LocalDatabase, api: SyncApi): Stage => {
  const entries: OutboxEntry[] = await database.outbox
    .orderBy("seq")
    .limit(SYNC_PUSH_MAX_MUTATIONS)
    .toArray();
  if (entries.length === 0) {
    return ok(undefined);
  }
  const pushed = await api.push(entries.map(({ id, mutation }) => ({ id, mutation })));
  if (!pushed.isOk) {
    return pushed;
  }
  const rejected = pushed.value.results.flatMap(({ id, status, error }) => {
    const entry = entries.find((candidate) => candidate.id === id);
    return status === "rejected" && entry !== undefined
      ? [{ entry, error: error ?? "internal" }]
      : [];
  });
  await recordRejections(database, entries, rejected);
  return pushOutbox(database, api);
};

const uploadOne = async (database: LocalDatabase, api: SyncApi, photo: PendingPhoto): Stage => {
  const uploaded = await api.upload(photo);
  if (uploaded.isOk || uploaded.error.code === PHOTO_ALREADY_UPLOADED) {
    await database.pendingPhotos.delete(photo.id);
    return ok(undefined);
  }
  if (uploaded.error.code === "network") {
    return uploaded;
  }
  await database.transaction(
    "rw",
    [database.pendingPhotos, database.photos, database.rejections],
    async () => {
      await database.pendingPhotos.delete(photo.id);
      await database.photos.delete(photo.id);
      await database.rejections.put({
        id: photo.id,
        description: "upload_photo",
        error: uploaded.error.code,
        at: new Date().toISOString(),
      });
    },
  );
  return ok(undefined);
};

const uploadPhotos = async (database: LocalDatabase, api: SyncApi): Stage => {
  const waiting = await pendingEntityIds(database);
  const photos = (await database.pendingPhotos.toArray()).filter(
    ({ equipmentId }) => !waiting.has(equipmentId),
  );
  return photos.reduce<Stage>(
    async (previous, photo) => {
      const result = await previous;
      return result.isOk ? uploadOne(database, api, photo) : result;
    },
    Promise.resolve(ok(undefined)),
  );
};

const pullAll = async (database: LocalDatabase, api: SyncApi): Stage => {
  const cursor = (await database.syncState.get("cursor"))?.value;
  const pulled = await api.pull(cursor);
  if (!pulled.isOk) {
    return pulled;
  }
  await applyPulledChanges(database, pulled.value);
  return pulled.value.hasMore ? pullAll(database, api) : ok(undefined);
};

const runStages = async (database: LocalDatabase, api: SyncApi): Stage => {
  const pushed = await pushOutbox(database, api);
  if (!pushed.isOk) {
    return pushed;
  }
  const uploaded = await uploadPhotos(database, api);
  if (!uploaded.isOk) {
    return uploaded;
  }
  const pulled = await pullAll(database, api);
  if (pulled.isOk) {
    await database.syncState.put({ key: "lastSyncedAt", value: new Date().toISOString() });
  }
  return pulled;
};

const running = new WeakMap<LocalDatabase, Stage>();

export const synchronize = (database: LocalDatabase, api: SyncApi = DEFAULT_API): Stage => {
  const current = running.get(database);
  if (current !== undefined) {
    return current;
  }
  const run = runStages(database, api)
    .catch((): Result<void, ApiError> => err({ code: "internal", traceId: null }))
    .finally(() => running.delete(database));
  running.set(database, run);
  return run;
};
