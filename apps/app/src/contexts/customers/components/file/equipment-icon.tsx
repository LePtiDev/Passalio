import { EQUIPMENT_CATALOG } from "@passalio/trades";
import { Flame, Heater } from "lucide-react";
import type { EquipmentRecord, PhotoRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import { usePhotoUrl } from "../../hooks/use-photo-url";

const PhotoThumbnail = ({ photoId }: { readonly photoId: string }) => {
  const url = usePhotoUrl(photoId);
  return (
    <span className="mt-0.5 flex size-11 shrink-0 overflow-hidden rounded-lg bg-[#EEF3F8] lg:mt-0 lg:size-10">
      {url === null ? null : (
        <img src={url} alt={customersFr.file.photo} className="size-full object-cover" />
      )}
    </span>
  );
};

export const EquipmentIcon = ({
  equipment,
  photo,
}: {
  readonly equipment: EquipmentRecord;
  readonly photo: PhotoRecord | undefined;
}) => {
  if (photo !== undefined && equipment.status === "active") {
    return <PhotoThumbnail photoId={photo.id} />;
  }
  const isHeatPump = EQUIPMENT_CATALOG[equipment.kind].family === "heat_pump";
  const Icon = isHeatPump ? Heater : Flame;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg lg:mt-0 lg:size-8",
        equipment.status === "removed" && "bg-[#EEF3F8] text-[#94A3B8]",
        equipment.status === "active" && isHeatPump && "bg-[#E7F1FB] text-[#1D4E89]",
        equipment.status === "active" && !isHeatPump && "bg-[#FEF3E2] text-[#B45309]",
      )}
    >
      <Icon className="size-[18px] lg:size-4" />
    </span>
  );
};
