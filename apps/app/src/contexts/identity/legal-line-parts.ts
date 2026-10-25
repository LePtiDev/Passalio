import { requiresShareCapital, type LegalForm, type RegistryKind } from "@passalio/trades";
import { LEGAL_FORM_SHORT_LABELS, settingsFr } from "./settings-fr";

export type LegalLinePart = {
  readonly id: string;
  readonly text: string;
  readonly isMissing: boolean;
};

export type LegalLineDraft = {
  readonly name: string;
  readonly legalForm: LegalForm | null;
  readonly siret: string;
  readonly shareCapital: string;
  readonly registryKind: RegistryKind | null;
  readonly registryCity: string;
  readonly address: string;
};

const text = settingsFr.company;

const line = text.line;

const present = (id: string, value: string): LegalLinePart => ({
  id,
  text: value,
  isMissing: false,
});

const missing = (id: string, label: string): LegalLinePart => ({
  id,
  text: label,
  isMissing: true,
});

const digitsOf = (value: string) => value.replaceAll(/\D/g, "");

const grouped = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

const sirenPart = (siret: string) => {
  const digits = digitsOf(siret);
  return digits.length === 14
    ? present("siren", digits.slice(0, 9).replace(/^(\d{3})(\d{3})(\d{3})$/, "$1\u00A0$2\u00A0$3"))
    : missing("siren", text.toFix);
};

const formParts = (draft: LegalLineDraft): readonly LegalLinePart[] => {
  if (draft.legalForm === null) {
    return [missing("form", text.legalForm.toLowerCase())];
  }
  const short = LEGAL_FORM_SHORT_LABELS[draft.legalForm];
  return short === null ? [] : [present("form", short)];
};

const capitalParts = (draft: LegalLineDraft): readonly LegalLinePart[] => {
  const digits = digitsOf(draft.shareCapital);
  if (digits !== "") {
    return [present("capital", line.capital(grouped(digits)))];
  }
  return draft.legalForm !== null && requiresShareCapital(draft.legalForm)
    ? [present("capital", line.capitalLabel), missing("capital-missing", text.toFix)]
    : [];
};

const registryParts = (draft: LegalLineDraft): readonly LegalLinePart[] => {
  if (draft.registryKind === "rne") {
    return [present("registry", line.rne)];
  }
  if (draft.registryKind === "rcs") {
    return draft.registryCity.trim() === ""
      ? [present("registry", line.rcsLabel), missing("registry-missing", text.toFix)]
      : [present("registry", line.rcs(draft.registryCity.trim()))];
  }
  return [missing("registry", text.registry.toLowerCase())];
};

export const legalLineParts = (draft: LegalLineDraft): readonly LegalLinePart[] => [
  draft.name.trim() === ""
    ? missing("name", text.name.toLowerCase())
    : present("name", draft.name.trim()),
  ...formParts(draft),
  ...capitalParts(draft),
  present("siren-label", line.siren),
  sirenPart(draft.siret),
  ...registryParts(draft),
  present("address-label", line.headOffice),
  draft.address.trim() === ""
    ? missing("address", text.toFix)
    : present("address", draft.address.trim()),
];
