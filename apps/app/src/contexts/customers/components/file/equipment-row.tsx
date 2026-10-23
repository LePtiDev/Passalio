import { useNavigate } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { EquipmentRecord, PhotoRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import {
  dueStatusOf,
  equipmentNameOf,
  formatCalendarDate,
  tradeTagsOf,
  type TradeTag,
} from "../../customer-view";
import { removeEquipment } from "../../equipment-store";
import { equipmentDetailLine } from "../../equipment-view";
import { customersFr } from "../../fr";
import { ConfirmDialog } from "../confirm-dialog";
import { ICON_BUTTON_CLASS } from "../customer-styles";
import { DueDate } from "../due-date";
import { EquipmentIcon } from "./equipment-icon";

const text = customersFr.file;

const TAG_CLASS: Readonly<Record<TradeTag, string>> = {
  chimney_sweeping: "bg-[#FEF3E2] text-[#B45309]",
  maintenance: "bg-[#EEF3F8] text-[#0F2A44]",
  heat_pump: "bg-[#E7F1FB] text-[#1D4E89]",
};

const EquipmentDue = ({
  equipment,
  today,
}: {
  readonly equipment: EquipmentRecord;
  readonly today: Date;
}) => {
  if (equipment.nextDueDate === null) {
    return <DueDate status={null} label={text.dueUnknown} />;
  }
  const status = dueStatusOf(equipment.nextDueDate, today);
  const date = formatCalendarDate(equipment.nextDueDate);
  return (
    <DueDate
      status={status === "later" ? null : status}
      label={status === "overdue" ? text.overdueSince(date) : text.nextDue(date)}
    />
  );
};

const EquipmentMenu = ({
  equipment,
  customerId,
  name,
}: {
  readonly equipment: EquipmentRecord;
  readonly customerId: string;
  readonly name: string;
}) => {
  const { database } = useLocalSession();
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const replace = useCallback(() => {
    void navigate({
      to: "/clients/$customerId/appareils/nouveau",
      params: { customerId },
      search: { lieu: equipment.siteId, remplace: equipment.id },
    });
  }, [navigate, customerId, equipment.siteId, equipment.id]);
  const askRemoval = useCallback(() => setIsConfirming(true), []);
  const remove = useCallback(async () => {
    try {
      await removeEquipment(database, equipment.id);
      toast.success(text.removed);
    } catch {
      toast.error(text.removeFailed);
    }
  }, [database, equipment.id]);
  const confirmRemoval = useCallback(() => {
    void remove();
  }, [remove]);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={text.equipmentActions} className={ICON_BUTTON_CLASS}>
          <Ellipsis aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="min-h-12 lg:min-h-8" onSelect={replace}>
            {text.replace}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="min-h-12 lg:min-h-8"
            onSelect={askRemoval}
          >
            {text.remove}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        isOpen={isConfirming}
        title={text.removeTitle(name)}
        description={text.removeText}
        confirmLabel={text.removeConfirm}
        onOpenChange={setIsConfirming}
        onConfirm={confirmRemoval}
      />
    </>
  );
};

type EquipmentRowProps = {
  readonly equipment: EquipmentRecord;
  readonly customerId: string;
  readonly photo: PhotoRecord | undefined;
  readonly replacementName: string | null;
  readonly today: Date;
};

export const EquipmentRow = ({
  equipment,
  customerId,
  photo,
  replacementName,
  today,
}: EquipmentRowProps) => {
  const isRemoved = equipment.status === "removed";
  const name = equipmentNameOf(equipment);
  return (
    <li
      className={cn(
        "flex items-start gap-3 border-t border-[#EEF2F6] py-3 pr-1.5 pl-3.5 lg:items-center lg:pr-3.5",
        isRemoved && "bg-[#FBFCFD]",
      )}
    >
      <EquipmentIcon equipment={equipment} photo={photo} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 flex-col gap-0.5 lg:flex-1">
          <span className="flex flex-wrap items-center gap-1.5 text-[15px] font-semibold lg:text-[13px]">
            <span className={cn(isRemoved && "text-[#64748B] line-through decoration-[#94A3B8]")}>
              {name}
            </span>
            {isRemoved
              ? null
              : tradeTagsOf(equipment).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase",
                      TAG_CLASS[tag],
                    )}
                  >
                    {customersFr.tradeTags[tag]}
                  </span>
                ))}
          </span>
          <span className="text-[13px] text-[#64748B]">
            {equipmentDetailLine(equipment, replacementName)}
          </span>
        </div>
        {isRemoved ? null : (
          <div className="pt-1 lg:w-[280px] lg:pt-0">
            <EquipmentDue equipment={equipment} today={today} />
          </div>
        )}
      </div>
      {isRemoved ? null : (
        <EquipmentMenu equipment={equipment} customerId={customerId} name={name} />
      )}
    </li>
  );
};
