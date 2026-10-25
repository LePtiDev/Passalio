import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  CARD_CLASS,
  equipmentDetailLine,
  EquipmentIcon,
  equipmentNameOf,
} from "@/contexts/customers";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { complianceFr } from "../../fr";

export const EquipmentSummary = ({
  equipment,
  customerId,
}: {
  readonly equipment: EquipmentRecord;
  readonly customerId: string;
}) => {
  const params = useMemo(() => ({ customerId }), [customerId]);
  return (
    <div className={cn(CARD_CLASS, "flex items-center gap-3 bg-[#F7F9FB] px-3.5 py-3")}>
      <EquipmentIcon equipment={equipment} photo={undefined} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">
          {equipmentNameOf(equipment)}
        </span>
        <span className="truncate text-[13px] text-[#64748B]">
          {equipmentDetailLine(equipment, null)}
        </span>
      </span>
      <Link
        to="/clients/$customerId"
        params={params}
        className="flex min-h-12 shrink-0 items-center px-1 text-[15px] font-semibold text-[#0E7C5A] lg:min-h-8 lg:text-[13px]"
      >
        {complianceFr.form.editEquipment}
      </Link>
    </div>
  );
};
