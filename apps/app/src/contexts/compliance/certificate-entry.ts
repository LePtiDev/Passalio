import { unsignedEquipmentsOf } from "./certificate-steps";

type VisitProgress = Parameters<typeof unsignedEquipmentsOf>[0] & {
  readonly drafts: ReadonlyMap<string, unknown>;
};

export type CertificateEntry =
  | { readonly step: "form"; readonly equipmentId: string }
  | { readonly step: "sign" }
  | { readonly step: "signed" }
  | null;

export const certificateEntryOf = (visit: VisitProgress): CertificateEntry => {
  if (visit.equipments.length === 0) {
    return visit.documents.length === 0 ? null : { step: "signed" };
  }
  const unsigned = unsignedEquipmentsOf(visit);
  if (unsigned.length === 0) {
    return { step: "signed" };
  }
  const toFill = unsigned.find(({ id }) => visit.drafts.get(id) === undefined);
  return toFill === undefined ? { step: "sign" } : { step: "form", equipmentId: toFill.id };
};
