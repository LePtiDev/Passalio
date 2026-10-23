import { EQUIPMENT_KINDS, offeredKinds, type EquipmentKind } from "@passalio/trades";
import { useOrganization } from "@/contexts/identity";

export const useOfferedKinds = (): readonly EquipmentKind[] => {
  const { data: organization } = useOrganization();
  const kinds = organization === undefined ? [] : offeredKinds(organization.trades);
  return kinds.length === 0 ? EQUIPMENT_KINDS : kinds;
};
