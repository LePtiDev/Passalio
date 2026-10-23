import { AccountsFilterLink } from "../accounts-filter-link";
import type { OverviewResponse } from "@passalio/shared";
import { backofficeFr } from "../../fr";

const text = backofficeFr.overview;

type Tile = {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
  readonly filter: "all" | "trial" | "dropping" | null;
};

const TILE_CLASS =
  "flex flex-col gap-1 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-none lg:border-0 lg:border-l lg:px-[18px] lg:py-3.5 lg:first:border-l-0";

const TileBody = ({ tile }: { readonly tile: Tile }) => (
  <>
    <span className="text-[13px] text-[#475569] lg:text-xs">{tile.label}</span>
    <span className="text-2xl font-bold tracking-tight tabular-nums lg:text-[22px]">
      {tile.value}
    </span>
    <span className="text-xs text-[#64748B]">{tile.hint}</span>
  </>
);

export const OverviewTiles = ({ counts }: { readonly counts: OverviewResponse["counts"] }) => {
  const tiles: readonly Tile[] = [
    { label: text.accounts, value: counts.all, hint: text.accountsHint, filter: "all" },
    {
      label: text.trial,
      value: counts.trial,
      hint: text.trialHint(counts.endingSoon),
      filter: "trial",
    },
    {
      label: text.activePeople,
      value: counts.activePeople,
      hint: text.activePeopleHint,
      filter: null,
    },
    { label: text.dropping, value: counts.dropping, hint: text.droppingHint, filter: "dropping" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-[#E3E8EF] lg:bg-white">
      {tiles.map((tile) =>
        tile.filter === null ? (
          <div key={tile.label} className={TILE_CLASS}>
            <TileBody tile={tile} />
          </div>
        ) : (
          <AccountsFilterLink
            key={tile.label}
            filter={tile.filter}
            className={`${TILE_CLASS} hover:bg-[#F7F9FB]`}
          >
            <TileBody tile={tile} />
          </AccountsFilterLink>
        ),
      )}
    </div>
  );
};
