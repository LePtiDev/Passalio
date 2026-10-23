import type { Position } from "./geocode.ts";
import { normalizeSearchText, type ImportedCompany } from "./prospect-rows.ts";

const literal = (value: string | number | boolean | null) => {
  if (value === null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return `'${value.replaceAll("'", "''")}'`;
};

const REGISTRY_COLUMNS = [
  "legal_name",
  "siren",
  "naf_code",
  "legal_form",
  "headcount",
  "founded_on",
  "registry_status",
] as const;

const searchTextOf = (company: ImportedCompany) =>
  normalizeSearchText(
    [company.name, company.city, company.postalCode, company.siren]
      .filter((part) => part !== null)
      .join(" "),
  );

const companyStatement = (
  company: ImportedCompany,
  position: Position | undefined,
  now: number,
) => {
  const values: Record<string, string | number | null> = {
    id: company.id,
    name: company.name,
    search_name: normalizeSearchText(company.name),
    search_text: searchTextOf(company),
    legal_name: company.legalName,
    siren: company.siren,
    naf_code: company.nafCode,
    legal_form: company.legalForm,
    address: company.address,
    postal_code: company.postalCode,
    city: company.city,
    department: company.department,
    latitude: position?.latitude ?? null,
    longitude: position?.longitude ?? null,
    phone: company.phone,
    email: company.email,
    website: company.website,
    activity: company.activity,
    headcount: company.headcount,
    founded_on: company.foundedOn,
    registry_status: company.registryStatus,
    notes: company.notes,
    stage: "to_qualify",
    owner_user_id: null,
    source_ref: company.sourceRef,
    created_at: now,
    updated_at: now,
  };
  const columns = Object.keys(values);
  const updates = REGISTRY_COLUMNS.map((column) => `${column} = excluded.${column}`).join(", ");
  return (
    `INSERT INTO prospect_companies (${columns.join(", ")}) VALUES (${Object.values(values).map(literal).join(", ")}) ` +
    `ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = excluded.updated_at;`
  );
};

const leaderStatement = (company: ImportedCompany, now: number) => {
  const { leader } = company;
  if (leader === null) {
    return null;
  }
  const searchName = normalizeSearchText(
    [leader.lastName, leader.firstName].filter(Boolean).join(" "),
  );
  return (
    "INSERT OR IGNORE INTO prospect_contacts (id, company_id, first_name, last_name, search_name, job_title, is_leader, is_main, created_at, updated_at) " +
    `VALUES (${[leader.id, company.id, leader.firstName, leader.lastName, searchName, leader.jobTitle, true, true, now, now].map(literal).join(", ")});`
  );
};

export const importStatements = (
  companies: readonly ImportedCompany[],
  positions: ReadonlyMap<string, Position>,
  now: number,
): string[] =>
  companies.flatMap((company) =>
    [
      companyStatement(company, positions.get(company.id), now),
      leaderStatement(company, now),
    ].filter((statement) => statement !== null),
  );
