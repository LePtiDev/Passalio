import * as z from "zod";
import type { ChangeCursor } from "@passalio/shared";
import { CUSTOMER_SYNC_TABLES } from "../../customers";

export const SYNC_TABLES = [...CUSTOMER_SYNC_TABLES, "interventions", "documents"] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];

export type SyncCursors = Partial<Record<SyncTable, ChangeCursor>>;

const tableCursor = z.tuple([z.number().int().nonnegative(), z.string().min(1).max(64)]);

const encodedCursors = z.partialRecord(z.enum(SYNC_TABLES), tableCursor);

const toBase64Url = (text: string) =>
  btoa(text).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

const fromBase64Url = (encoded: string) => atob(encoded.replaceAll("-", "+").replaceAll("_", "/"));

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const decodeBase64Url = (encoded: string) => {
  try {
    return fromBase64Url(encoded);
  } catch {
    return "";
  }
};

export const decodeSyncCursor = (encoded: string | undefined): SyncCursors | undefined => {
  if (encoded === undefined) {
    return {};
  }
  const parsed = encodedCursors.safeParse(parseJson(decodeBase64Url(encoded)));
  if (!parsed.success) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(parsed.data).map(([table, [updatedAt, id]]) => [
      table,
      { updatedAt: new Date(updatedAt), id },
    ]),
  );
};

export const encodeSyncCursor = (cursors: SyncCursors) =>
  toBase64Url(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(cursors).map(([table, { updatedAt, id }]) => [
          table,
          [updatedAt.getTime(), id],
        ]),
      ),
    ),
  );
