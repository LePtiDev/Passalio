export type ChangeCursor = {
  readonly updatedAt: Date;
  readonly id: string;
};

export type Tombstoned<T> = T & { readonly deletedAt: Date | null };

export type ChangesAfter<T> = (
  organizationId: string,
  after: ChangeCursor | undefined,
  limit: number,
) => Promise<readonly Tombstoned<T>[]>;

export type ChangePage<T> = {
  readonly rows: readonly T[];
  readonly cursor: ChangeCursor | undefined;
  readonly hasMore: boolean;
};

export const SYNC_PAGE_SIZE = 200;

export const changePageOf = async <T extends { readonly id: string; readonly updatedAt: Date }>(
  rows: Promise<readonly T[]>,
  current: ChangeCursor | undefined,
): Promise<ChangePage<T>> => {
  const fetched = await rows;
  const visible = fetched.slice(0, SYNC_PAGE_SIZE);
  const last = visible.at(-1);
  return {
    rows: visible,
    cursor: last === undefined ? current : { updatedAt: last.updatedAt, id: last.id },
    hasMore: fetched.length > SYNC_PAGE_SIZE,
  };
};
