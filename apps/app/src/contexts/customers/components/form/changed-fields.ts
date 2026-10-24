const isSameValue = (before: unknown, after: unknown) =>
  JSON.stringify(before ?? null) === JSON.stringify(after ?? null);

export const changedFields = (before: object, after: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(after).filter(([key, value]) => !isSameValue(Reflect.get(before, key), value)),
  );
