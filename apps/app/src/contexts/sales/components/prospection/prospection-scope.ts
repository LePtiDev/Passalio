import type { ProspectPin } from "../../sales-api";

export const PROSPECTION_TABS = ["to_qualify", "qualified", "not_interested"] as const;

export type ProspectionTab = (typeof PROSPECTION_TABS)[number];

export type ProspectionScope = {
  readonly tab: ProspectionTab;
  readonly department: string | null;
  readonly search: string;
  readonly companyId: string | null;
};

export type ProspectionChanges = Partial<ProspectionScope>;

const folded = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const pinsMatching = (pins: readonly ProspectPin[], search: string) => {
  const query = folded(search);
  if (query === "") {
    return pins;
  }
  return pins.filter(
    (pin) => folded(pin.name).includes(query) || folded(pin.city ?? "").includes(query),
  );
};

export const neighbourOf = (ids: readonly string[], companyId: string) => {
  const index = ids.indexOf(companyId);
  if (index === -1) {
    return companyId;
  }
  return ids[index + 1] ?? ids[index - 1] ?? null;
};

export const webAddressOf = (website: string) =>
  website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
