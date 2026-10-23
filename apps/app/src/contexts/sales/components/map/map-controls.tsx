import type { ProspectStage } from "@passalio/shared";
import type { Map as LeafletMap } from "leaflet";
import { useCallback } from "react";
import { salesFr } from "../../fr";
import { StageDot } from "../stage-label";

const text = salesFr.prospection;

const ZOOM_BUTTON_CLASS =
  "flex size-8 items-center justify-center bg-white text-base text-[#334155] hover:bg-[#F7F9FB]";

export const ZoomButtons = ({ map }: { readonly map: LeafletMap | null }) => {
  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);
  return (
    <div className="absolute top-4 right-4 z-10 hidden flex-col overflow-hidden rounded-lg border border-[#E3E8EF] bg-white lg:flex">
      <button
        type="button"
        aria-label={text.zoomIn}
        className={`${ZOOM_BUTTON_CLASS} border-b border-[#E3E8EF]`}
        onClick={zoomIn}
      >
        +
      </button>
      <button
        type="button"
        aria-label={text.zoomOut}
        className={ZOOM_BUTTON_CLASS}
        onClick={zoomOut}
      >
        −
      </button>
    </div>
  );
};

const LEGEND_STAGES: readonly ProspectStage[] = [
  "to_qualify",
  "qualified",
  "interested",
  "demo_planned",
  "not_interested",
];

export const MapLegend = ({ hasCustomers }: { readonly hasCustomers: boolean }) => (
  <ul
    aria-label={text.legend}
    className="absolute bottom-4 left-4 z-10 hidden flex-wrap gap-3 rounded-lg border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-xs text-[#475569] lg:flex"
  >
    {(hasCustomers ? [...LEGEND_STAGES, "customer" as const] : LEGEND_STAGES).map((stage) => (
      <li key={stage} className="inline-flex items-center gap-1.5">
        <StageDot stage={stage} />
        {salesFr.stages[stage]}
      </li>
    ))}
  </ul>
);
