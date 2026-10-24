import { clockLabel } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import type { MyDaySummary } from "./my-day-summary";

const text = callsFr.myDay;

const TILE_CLASS =
  "flex flex-col gap-0.5 rounded-[14px] border border-[#E3E8EF] bg-white px-3.5 py-3 lg:gap-1.5 lg:rounded-xl lg:px-[18px] lg:py-4";

type Tile = { readonly label: string; readonly value: number; readonly hint: string };

export const MyDayTiles = ({ summary }: { readonly summary: MyDaySummary }) => {
  const tiles: readonly Tile[] = [
    { label: text.callsToday, value: summary.callsToday, hint: text.callsTodayHint },
    {
      label: text.callbacks,
      value: summary.callbacks,
      hint:
        summary.nextCallbackAt === null
          ? text.noneLeft
          : text.nextAt(clockLabel(summary.nextCallbackAt)),
    },
    { label: text.overdue, value: summary.overdue, hint: text.overdueHint(summary.overdue) },
    { label: text.demos, value: summary.demos, hint: text.demosHint(summary.demos) },
  ];
  return (
    <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
      {tiles.map((tile) => (
        <li key={tile.label} className={TILE_CLASS}>
          <span className="text-[13px] font-medium text-[#64748B]">{tile.label}</span>
          <span className="text-[26px] leading-tight font-bold tabular-nums lg:text-[30px]">
            {tile.value}
          </span>
          <span className="text-[13px] text-[#475569]">{tile.hint}</span>
        </li>
      ))}
    </ul>
  );
};
