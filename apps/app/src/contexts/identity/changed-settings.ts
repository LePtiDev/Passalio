import type { SettingsChanges } from "./document-settings-api";

type SettingsKey = keyof SettingsChanges;

const isSameValue = (before: unknown, after: unknown) =>
  JSON.stringify(before ?? null) === JSON.stringify(after ?? null);

const keysOf = (changes: SettingsChanges) =>
  Object.keys(changes).filter((key): key is SettingsKey => key in changes);

const pick = (changes: SettingsChanges, key: SettingsKey): SettingsChanges => ({
  [key]: changes[key],
});

export const changedSettings = (before: SettingsChanges, after: SettingsChanges): SettingsChanges =>
  keysOf(after)
    .filter((key) => !isSameValue(before[key], after[key]))
    .reduce<SettingsChanges>((changes, key) => ({ ...changes, ...pick(after, key) }), {});

export const changeCount = (before: SettingsChanges, after: SettingsChanges) =>
  Object.keys(changedSettings(before, after)).length;
