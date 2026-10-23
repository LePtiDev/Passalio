import type { NameCursor } from "../domain/prospect-ports";

const SEPARATOR = "|";

export const encodeNameCursor = ({ searchName, id }: NameCursor) =>
  `${searchName}${SEPARATOR}${id}`;

export const decodeNameCursor = (cursor: string | undefined): NameCursor | undefined => {
  if (cursor === undefined) {
    return undefined;
  }
  const index = cursor.lastIndexOf(SEPARATOR);
  return index === -1
    ? undefined
    : { searchName: cursor.slice(0, index), id: cursor.slice(index + 1) };
};

export const pageOf = <Row extends NameCursor>(rows: readonly Row[], size: number) => {
  const visible = rows.slice(0, size);
  const last = visible.at(-1);
  return {
    visible,
    nextCursor: rows.length > size && last !== undefined ? encodeNameCursor(last) : null,
  };
};
