import {
  DOCUMENT_NUMBER_PREFIX_PATTERN,
  err,
  MAX_FIRST_DOCUMENT_NUMBER,
  ok,
  type BrandColor,
  type Result,
  type TeamSize,
} from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import {
  blankToNull,
  normalizeDocumentProfileChanges,
  type DocumentAppearance,
  type LegalDetails,
} from "./document-profile";
import type { Organization } from "./identity-models";
import { normalizeOrganizationName } from "./organization-name";

export type CompanyDetails = {
  readonly siret: string | null;
  readonly address: string | null;
  readonly phone: string | null;
  readonly teamSize: TeamSize | null;
};

export type DocumentSettings = {
  readonly trades: readonly TradeId[];
  readonly brandColor: BrandColor;
  readonly documentNumberPrefix: string;
  readonly nextDocumentNumber: number;
};

export type OrganizationProfile = Organization &
  CompanyDetails &
  LegalDetails &
  DocumentSettings &
  DocumentAppearance & {
    readonly logoKey: string | null;
    readonly onboardingCompletedAt: Date | null;
    readonly hasReservedNumbers: boolean;
  };

type OptionalFields<T> = { readonly [Key in keyof T]?: T[Key] | undefined };

export type OptionalCompanyDetails = OptionalFields<CompanyDetails>;

type EditableProfile = Pick<Organization, "name"> &
  CompanyDetails &
  LegalDetails &
  DocumentSettings &
  DocumentAppearance;

export type ProfileChanges = OptionalFields<EditableProfile>;

export type NormalizedProfileChanges = Partial<EditableProfile>;

export type ProfileError =
  | "invalid_organization_name"
  | "invalid_siret"
  | "invalid_ape_code"
  | "invalid_document_numbering";

const SIRET_LENGTH = 14;

export const normalizeSiret = (raw: string): Result<string, "invalid_siret"> => {
  const digits = raw.replaceAll(/\s/g, "");
  return /^\d+$/.test(digits) && digits.length === SIRET_LENGTH ? ok(digits) : err("invalid_siret");
};

const isValidNumbering = ({ documentNumberPrefix, nextDocumentNumber }: ProfileChanges) =>
  (documentNumberPrefix === undefined ||
    DOCUMENT_NUMBER_PREFIX_PATTERN.test(documentNumberPrefix)) &&
  (nextDocumentNumber === undefined ||
    (Number.isInteger(nextDocumentNumber) &&
      nextDocumentNumber >= 1 &&
      nextDocumentNumber <= MAX_FIRST_DOCUMENT_NUMBER));

const normalizeOptionalSiret = (
  siret: string | null | undefined,
): Result<string | null | undefined, "invalid_siret"> => {
  const value = siret === undefined ? undefined : blankToNull(siret);
  return value === undefined || value === null ? ok(value) : normalizeSiret(value);
};

const definedOnly = <Key extends keyof EditableProfile>(
  key: Key,
  value: EditableProfile[Key] | undefined,
): Partial<EditableProfile> => (value === undefined ? {} : { [key]: value });

export const normalizeProfileChanges = (
  changes: ProfileChanges,
): Result<NormalizedProfileChanges, ProfileError> => {
  const name = changes.name === undefined ? ok(undefined) : normalizeOrganizationName(changes.name);
  if (!name.isOk) {
    return name;
  }
  const siret = normalizeOptionalSiret(changes.siret);
  if (!siret.isOk) {
    return siret;
  }
  if (!isValidNumbering(changes)) {
    return err("invalid_document_numbering");
  }
  const documentProfile = normalizeDocumentProfileChanges(changes);
  if (!documentProfile.isOk) {
    return documentProfile;
  }
  return ok({
    ...documentProfile.value,
    ...definedOnly("name", name.value),
    ...definedOnly("siret", siret.value),
    ...definedOnly(
      "address",
      changes.address === undefined ? undefined : blankToNull(changes.address),
    ),
    ...definedOnly("phone", changes.phone === undefined ? undefined : blankToNull(changes.phone)),
    ...definedOnly("teamSize", changes.teamSize),
    ...definedOnly(
      "trades",
      changes.trades === undefined ? undefined : [...new Set(changes.trades)],
    ),
    ...definedOnly("brandColor", changes.brandColor),
    ...definedOnly("documentNumberPrefix", changes.documentNumberPrefix),
    ...definedOnly("nextDocumentNumber", changes.nextDocumentNumber),
  });
};

export const isNumberingRewound = (
  profile: Pick<OrganizationProfile, "hasReservedNumbers" | "nextDocumentNumber">,
  changes: NormalizedProfileChanges,
) =>
  profile.hasReservedNumbers &&
  changes.nextDocumentNumber !== undefined &&
  changes.nextDocumentNumber < profile.nextDocumentNumber;
