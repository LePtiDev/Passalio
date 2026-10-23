import type { AccountCursor, JournalCursor } from "../domain/backoffice-ports";

const SEPARATOR = "|";

const split = (cursor: string | undefined) => {
  if (cursor === undefined) {
    return undefined;
  }
  const index = cursor.lastIndexOf(SEPARATOR);
  return index === -1 ? undefined : { head: cursor.slice(0, index), id: cursor.slice(index + 1) };
};

export const encodeAccountCursor = ({ name, id }: AccountCursor) => `${name}${SEPARATOR}${id}`;

export const decodeAccountCursor = (cursor: string | undefined): AccountCursor | undefined => {
  const parts = split(cursor);
  return parts === undefined ? undefined : { name: parts.head, id: parts.id };
};

export const encodeJournalCursor = ({ createdAt, id }: JournalCursor) =>
  `${createdAt.getTime()}${SEPARATOR}${id}`;

export const decodeJournalCursor = (cursor: string | undefined): JournalCursor | undefined => {
  const parts = split(cursor);
  const time = parts === undefined ? Number.NaN : Number(parts.head);
  return parts === undefined || !Number.isSafeInteger(time)
    ? undefined
    : { createdAt: new Date(time), id: parts.id };
};
