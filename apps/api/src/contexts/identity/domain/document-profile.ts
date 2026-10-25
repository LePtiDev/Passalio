import { err, ok, type DocumentTemplate, type Result } from "@passalio/shared";
import type { LegalForm, RegistryKind } from "@passalio/trades";

export type LegalDetails = {
  readonly legalForm: LegalForm | null;
  readonly shareCapitalEuros: number | null;
  readonly registryKind: RegistryKind | null;
  readonly registryCity: string | null;
  readonly apeCode: string | null;
  readonly qualification: string | null;
};

export type DocumentAppearance = {
  readonly documentTemplate: DocumentTemplate;
  readonly contactEmail: string | null;
  readonly website: string | null;
  readonly customerMessage: string | null;
  readonly footerText: string | null;
  readonly isAdviceAttachedByDefault: boolean;
};

type OptionalFields<T> = { readonly [Key in keyof T]?: T[Key] | undefined };

export type DocumentProfileChanges = OptionalFields<LegalDetails & DocumentAppearance>;

export type NormalizedDocumentProfileChanges = Partial<LegalDetails & DocumentAppearance>;

const APE_CODE_PATTERN = /^\d{4}[A-Z]$/;

export const blankToNull = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 ? null : trimmed;
};

const normalizeApeCode = (
  raw: string | null | undefined,
): Result<string | null | undefined, "invalid_ape_code"> => {
  if (raw === undefined || raw === null) {
    return ok(raw);
  }
  const code = raw.replaceAll(/[\s.]/g, "").toUpperCase();
  if (code.length === 0) {
    return ok(null);
  }
  return APE_CODE_PATTERN.test(code) ? ok(code) : err("invalid_ape_code");
};

type Fields = LegalDetails & DocumentAppearance;

const definedOnly = <Key extends keyof Fields>(
  key: Key,
  value: Fields[Key] | undefined,
): Partial<Fields> => (value === undefined ? {} : { [key]: value });

const textChange = (value: string | null | undefined) =>
  value === undefined ? undefined : blankToNull(value);

export const normalizeDocumentProfileChanges = (
  changes: DocumentProfileChanges,
): Result<NormalizedDocumentProfileChanges, "invalid_ape_code"> => {
  const apeCode = normalizeApeCode(changes.apeCode);
  if (!apeCode.isOk) {
    return apeCode;
  }
  return ok({
    ...definedOnly("legalForm", changes.legalForm),
    ...definedOnly("shareCapitalEuros", changes.shareCapitalEuros),
    ...definedOnly("registryKind", changes.registryKind),
    ...definedOnly("registryCity", textChange(changes.registryCity)),
    ...definedOnly("apeCode", apeCode.value),
    ...definedOnly("qualification", textChange(changes.qualification)),
    ...definedOnly("documentTemplate", changes.documentTemplate),
    ...definedOnly("contactEmail", textChange(changes.contactEmail)),
    ...definedOnly("website", textChange(changes.website)),
    ...definedOnly("customerMessage", textChange(changes.customerMessage)),
    ...definedOnly("footerText", textChange(changes.footerText)),
    ...definedOnly("isAdviceAttachedByDefault", changes.isAdviceAttachedByDefault),
  });
};
