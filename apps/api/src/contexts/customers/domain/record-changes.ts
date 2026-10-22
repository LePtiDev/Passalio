export type Changes<T> = { readonly [Key in keyof T]?: T[Key] | undefined };

export const withChanges = <T extends object>(current: T, changes: Changes<T>): T => ({
  ...current,
  ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
});
