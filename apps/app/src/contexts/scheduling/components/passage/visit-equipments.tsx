import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
  CARD_CLASS,
  equipmentDetailLine,
  EquipmentIcon,
  equipmentNameOf,
  NEUTRAL_BADGE_CLASS,
} from "@/contexts/customers";
import type { DocumentRecord, EquipmentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";

const text = schedulingFr.visit;

const ROW_CLASS =
  "flex items-center gap-3 border-t border-[#EEF2F6] px-3.5 py-3 hover:bg-[#F7F9FB] first:border-t-0";

const EquipmentRow = ({
  interventionId,
  equipment,
  isSigned,
}: {
  readonly interventionId: string;
  readonly equipment: EquipmentRecord;
  readonly isSigned: boolean;
}) => {
  const formParams = useMemo(
    () => ({ interventionId, equipmentId: equipment.id }),
    [interventionId, equipment.id],
  );
  const visitParams = useMemo(() => ({ interventionId }), [interventionId]);
  const content = (
    <>
      <EquipmentIcon equipment={equipment} photo={undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">
          {equipmentNameOf(equipment)}
        </span>
        <span className="truncate text-[13px] text-[#64748B]">
          {equipmentDetailLine(equipment, null)}
        </span>
      </div>
      <span className={cn(NEUTRAL_BADGE_CLASS, isSigned && "bg-[#E6F4EE] text-[#0E7C5A]")}>
        {isSigned ? schedulingFr.planning.signed : text.toFill}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[#94A3B8]" />
    </>
  );
  return (
    <li>
      {isSigned ? (
        <Link
          to="/passages/$interventionId/certificats-signes"
          params={visitParams}
          className={ROW_CLASS}
        >
          {content}
        </Link>
      ) : (
        <Link
          to="/passages/$interventionId/certificat/$equipmentId"
          params={formParams}
          className={ROW_CLASS}
        >
          {content}
        </Link>
      )}
    </li>
  );
};

export const VisitEquipments = ({
  interventionId,
  equipments,
  documents,
}: {
  readonly interventionId: string;
  readonly equipments: readonly EquipmentRecord[];
  readonly documents: readonly DocumentRecord[];
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-[15px] font-bold lg:text-sm">{text.equipmentsTitle}</h2>
    <div className={CARD_CLASS}>
      {equipments.length === 0 ? (
        <p className="px-3.5 py-3 text-[15px] text-[#64748B] lg:text-[13px]">{text.noEquipment}</p>
      ) : (
        <ul>
          {equipments.map((equipment) => (
            <EquipmentRow
              key={equipment.id}
              interventionId={interventionId}
              equipment={equipment}
              isSigned={documents.some(({ equipmentId }) => equipmentId === equipment.id)}
            />
          ))}
        </ul>
      )}
    </div>
  </section>
);
