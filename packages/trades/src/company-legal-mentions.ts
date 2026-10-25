import { err, ok, type Result } from "@passalio/shared";
import {
  chimneySweepingCertificate,
  type CertificateCompany,
  type LegalForm,
  type RegistryKind,
} from "./chimney-sweeping/certificate";
import { requiresShareCapital } from "./chimney-sweeping/certificate-rules";

export type CompanyLegalDetails = {
  readonly name: string;
  readonly legalForm: LegalForm | null;
  readonly shareCapitalEuros: number | null;
  readonly siret: string | null;
  readonly registryKind: RegistryKind | null;
  readonly registryCity: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly qualification: string | null;
};

export const LEGAL_MENTIONS = [
  "name",
  "legalForm",
  "siret",
  "shareCapitalEuros",
  "registry",
  "address",
] as const;

export type LegalMention = (typeof LEGAL_MENTIONS)[number];

const isBlank = (value: string | null) => value === null || value.trim().length === 0;

const IS_MISSING: Readonly<Record<LegalMention, (details: CompanyLegalDetails) => boolean>> = {
  name: (details) => isBlank(details.name),
  legalForm: (details) => details.legalForm === null,
  siret: (details) => details.siret === null || !/^\d{14}$/.test(details.siret),
  shareCapitalEuros: (details) =>
    details.legalForm !== null &&
    requiresShareCapital(details.legalForm) &&
    details.shareCapitalEuros === null,
  registry: (details) =>
    details.registryKind === null ||
    (details.registryKind === "rcs" && isBlank(details.registryCity)),
  address: (details) => isBlank(details.address),
};

export const missingLegalMentions = (details: CompanyLegalDetails): readonly LegalMention[] =>
  LEGAL_MENTIONS.filter((mention) => IS_MISSING[mention](details));

const registryOf = (details: CompanyLegalDetails) =>
  details.registryKind === "rcs"
    ? { kind: "rcs" as const, city: details.registryCity ?? "" }
    : { kind: "rne" as const };

export const certificateCompanyOf = (
  details: CompanyLegalDetails,
): Result<CertificateCompany, "company_incomplete"> => {
  if (missingLegalMentions(details).length > 0) {
    return err("company_incomplete");
  }
  const parsed = chimneySweepingCertificate.shape.company.safeParse({
    name: details.name,
    legalForm: details.legalForm,
    shareCapitalEuros: details.shareCapitalEuros,
    siren: details.siret?.slice(0, 9),
    registry: registryOf(details),
    address: details.address,
    phone: details.phone,
    qualification: details.qualification,
  });
  return parsed.success ? ok(parsed.data) : err("company_incomplete");
};
