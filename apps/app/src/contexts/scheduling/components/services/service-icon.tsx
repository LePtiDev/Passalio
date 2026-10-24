import type { TradeId } from "@passalio/trades";
import {
  AirVent,
  Brush,
  Cylinder,
  Droplets,
  Flame,
  Heater,
  Tag,
  Thermometer,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";

const TRADE_ICONS: Readonly<Record<TradeId, LucideIcon>> = {
  chimney_sweeping: Flame,
  stove_maintenance: Heater,
  boiler_maintenance: Thermometer,
  heat_pump_maintenance: AirVent,
  septic_tank_emptying: Droplets,
};

const NAME_ICONS: readonly (readonly [RegExp, LucideIcon])[] = [
  [/d[ée]bistr/i, Brush],
  [/tubage/i, Cylinder],
  [/install|pose|remplac|raccord/i, Wrench],
  [/chaudi[eè]re/i, Thermometer],
  [/po[eê]le|insert|granul/i, Heater],
];

export const serviceIconOf = (name: string, trade: TradeId | null): LucideIcon =>
  NAME_ICONS.find(([pattern]) => pattern.test(name))?.[1] ??
  (trade === null ? Tag : TRADE_ICONS[trade]);

export const ServiceIcon = ({
  name,
  trade,
}: {
  readonly name: string;
  readonly trade: TradeId | null;
}) => {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3E2] text-[#B45309] lg:size-8"
    >
      {createElement(serviceIconOf(name, trade), { className: "size-4" })}
    </span>
  );
};
