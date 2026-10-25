type VisitProgress = {
  readonly equipments: readonly { readonly id: string }[];
  readonly documents: readonly { readonly equipmentId: string | null }[];
  readonly drafts: ReadonlyMap<string, unknown>;
};

export const isEquipmentSigned = (visit: Pick<VisitProgress, "documents">, equipmentId: string) =>
  visit.documents.some((document) => document.equipmentId === equipmentId);

export const unsignedEquipmentsOf = <Equipment extends { readonly id: string }>(
  visit: Omit<VisitProgress, "equipments"> & { readonly equipments: readonly Equipment[] },
): readonly Equipment[] => visit.equipments.filter(({ id }) => !isEquipmentSigned(visit, id));

export const nextEquipmentIdOf = (visit: VisitProgress, currentId: string): string | null => {
  const index = visit.equipments.findIndex(({ id }) => id === currentId);
  const ordered = [...visit.equipments.slice(index + 1), ...visit.equipments.slice(0, index)];
  const next = ordered.find(
    ({ id }) =>
      id !== currentId && !isEquipmentSigned(visit, id) && visit.drafts.get(id) === undefined,
  );
  return next?.id ?? null;
};
