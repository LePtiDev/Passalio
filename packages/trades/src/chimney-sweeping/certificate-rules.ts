import { err, ok, type Result } from "@passalio/shared";
import { EQUIPMENT_CATALOG, type EquipmentKind } from "../equipment-catalog";
import type { FLUE_TYPES } from "../equipment-details";
import {
  chimneySweepingCertificate,
  type ChimneySweepingCertificate,
  type LegalForm,
} from "./certificate";

export type CertificateError =
  | "invalid_certificate"
  | "equipment_mismatch"
  | "sweeping_extent_mismatch"
  | "unswept_part_required"
  | "advice_required"
  | "share_capital_required"
  | "customer_signature_required"
  | "completed_before_visit";

export type SweptEquipment = {
  readonly kind: EquipmentKind;
  readonly flueType: (typeof FLUE_TYPES)[number] | null;
};

const LEGAL_FORMS_WITH_CAPITAL: ReadonlySet<LegalForm> = new Set([
  "eurl",
  "sarl",
  "sasu",
  "sas",
  "sa",
]);

export const requiresShareCapital = (legalForm: LegalForm) =>
  LEGAL_FORMS_WITH_CAPITAL.has(legalForm);

export const isSealedAppliance = ({ flueType }: SweptEquipment) => flueType === "sealed_concentric";

export const requiresUsageAdvice = ({ kind }: SweptEquipment) =>
  EQUIPMENT_CATALOG[kind].family === "flue_appliance";

const firstBroken = (
  certificate: ChimneySweepingCertificate,
  equipment: SweptEquipment,
): CertificateError | undefined => {
  const rules: readonly [boolean, CertificateError][] = [
    [certificate.equipment.kind !== equipment.kind, "equipment_mismatch"],
    [
      isSealedAppliance(equipment) !== (certificate.sweepingExtent === "sealed_appliance"),
      "sweeping_extent_mismatch",
    ],
    [
      certificate.sweepingExtent === "partial" && certificate.unsweptPart === null,
      "unswept_part_required",
    ],
    [requiresUsageAdvice(equipment) && !certificate.isAdviceAttached, "advice_required"],
    [
      requiresShareCapital(certificate.company.legalForm) &&
        certificate.company.shareCapitalEuros === null,
      "share_capital_required",
    ],
    [
      certificate.customerSignature === null && !certificate.isCustomerAbsent,
      "customer_signature_required",
    ],
    [certificate.completedOn < certificate.visitedOn, "completed_before_visit"],
  ];
  return rules.find(([isBroken]) => isBroken)?.[1];
};

export const checkCertificate = (
  data: unknown,
  equipment: SweptEquipment,
): Result<ChimneySweepingCertificate, CertificateError> => {
  const parsed = chimneySweepingCertificate.safeParse(data);
  if (!parsed.success) {
    return err("invalid_certificate");
  }
  const broken = firstBroken(parsed.data, equipment);
  return broken === undefined ? ok(parsed.data) : err(broken);
};
