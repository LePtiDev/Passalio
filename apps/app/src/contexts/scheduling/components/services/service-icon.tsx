import type { TradeId } from "@passalio/trades";
import { AirVent, Droplets, Flame, Heater, Tag, Thermometer, type LucideIcon } from "lucide-react";

const ICONS: Readonly<Record<TradeId, LucideIcon>> = {
  chimney_sweeping: Flame,
  stove_maintenance: Heater,
  boiler_maintenance: Thermometer,
  heat_pump_maintenance: AirVent,
  septic_tank_emptying: Droplets,
};

export const ServiceIcon = ({ trade }: { readonly trade: TradeId | null }) => {
  const Icon = trade === null ? Tag : ICONS[trade];
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FDF1E4] text-[#B45309] lg:size-8"
    >
      <Icon className="size-[18px] lg:size-4" strokeWidth={1.8} />
    </span>
  );
};
