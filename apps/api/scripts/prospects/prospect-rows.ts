import { createHash } from "node:crypto";

export const CLOSED_REGISTRY_STATUS = "Fermée ou radiée";
const SKIPPED_LEADER_TITLES = ["liquidateur"];

export type ImportedContact = {
  readonly id: string;
  readonly firstName: string | null;
  readonly lastName: string;
  readonly jobTitle: string | null;
};

export type ImportedCompany = {
  readonly id: string;
  readonly sourceRef: string;
  readonly name: string;
  readonly legalName: string | null;
  readonly siren: string | null;
  readonly nafCode: string | null;
  readonly legalForm: string | null;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly department: string;
  readonly phone: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly activity: string | null;
  readonly headcount: string | null;
  readonly foundedOn: string | null;
  readonly registryStatus: string | null;
  readonly notes: string | null;
  readonly leader: ImportedContact | null;
};

const valueOf = (record: Readonly<Record<string, string>>, column: string) => {
  const value = record[column]?.trim() ?? "";
  return value === "" ? null : value;
};

export const stableIdOf = (key: string) => {
  const hex = createHash("sha256").update(key).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export const normalizeSearchText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const departmentOf = (record: Readonly<Record<string, string>>) =>
  (valueOf(record, "Département") ?? "").padStart(2, "0");

const leaderOf = (
  record: Readonly<Record<string, string>>,
  companyRef: string,
): ImportedContact | null => {
  const lastName = valueOf(record, "Dirigeant nom");
  const jobTitle = valueOf(record, "Fonction");
  if (
    lastName === null ||
    SKIPPED_LEADER_TITLES.some((title) => jobTitle?.toLowerCase().includes(title) === true)
  ) {
    return null;
  }
  return {
    id: stableIdOf(`${companyRef}:leader`),
    firstName: valueOf(record, "Dirigeant prénom"),
    lastName,
    jobTitle,
  };
};

const notesOf = (record: Readonly<Record<string, string>>) => {
  const others = valueOf(record, "Autres dirigeants");
  const parts = [
    valueOf(record, "Infos pour l'appel"),
    others === null ? null : `Autres dirigeants : ${others}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : parts.join("\n");
};

export const importedCompanyOf = (
  record: Readonly<Record<string, string>>,
): ImportedCompany | null => {
  const name = valueOf(record, "Entreprise");
  const department = departmentOf(record);
  if (
    name === null ||
    department === "00" ||
    valueOf(record, "Statut registre") === CLOSED_REGISTRY_STATUS
  ) {
    return null;
  }
  const siren = valueOf(record, "SIREN")?.replace(/\s/g, "") ?? null;
  const postalCode = valueOf(record, "Code postal");
  const sourceRef = `carnet:${siren ?? normalizeSearchText(`${name} ${postalCode ?? department}`)}`;
  return {
    id: stableIdOf(sourceRef),
    sourceRef,
    name,
    legalName: valueOf(record, "Raison sociale (registre)"),
    siren: siren !== null && /^\d{9}$/.test(siren) ? siren : null,
    nafCode: valueOf(record, "Code NAF"),
    legalForm: valueOf(record, "Forme juridique"),
    address: valueOf(record, "Adresse"),
    postalCode: postalCode !== null && /^\d{5}$/.test(postalCode) ? postalCode : null,
    city: valueOf(record, "Ville"),
    department,
    phone: valueOf(record, "Téléphone (public)"),
    email: valueOf(record, "Email (public)"),
    website: valueOf(record, "Site web"),
    activity: valueOf(record, "Activité"),
    headcount: valueOf(record, "Effectif"),
    foundedOn: valueOf(record, "Création"),
    registryStatus: valueOf(record, "Statut registre"),
    notes: notesOf(record),
    leader: leaderOf(record, sourceRef),
  };
};
