import { useSyncExternalStore } from "react";
import type { ApiError } from "../api-client";

export type SyncPhase = "idle" | "syncing" | "offline" | "error";

export type SyncStatus = {
  readonly phase: SyncPhase;
  readonly error: ApiError | null;
};

const INITIAL_STATUS: SyncStatus = { phase: "idle", error: null };

let status: SyncStatus = INITIAL_STATUS;
const listeners = new Set<() => void>();

export const setSyncStatus = (next: SyncStatus) => {
  status = next;
  listeners.forEach((listener) => listener());
};

export const currentSyncStatus = () => status;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSyncPhase = () => useSyncExternalStore(subscribe, currentSyncStatus);
