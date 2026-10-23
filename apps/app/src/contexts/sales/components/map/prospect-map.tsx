import type { ReactNode } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import type { ProspectPin } from "../../sales-api";
import { MapLegend, ZoomButtons } from "./map-controls";
import { MAP_CANVAS_CLASS, useLeafletMap } from "./use-leaflet-map";
import { usePinLayer, type PinView } from "./use-pin-layer";

const DESKTOP_VIEW: PinView = {
  padding: { topLeft: [340, 40], bottomRight: [64, 64] },
  focusZoom: null,
};

const MOBILE_VIEW: PinView = {
  padding: { topLeft: [24, 84], bottomRight: [24, 260] },
  focusZoom: 13,
};

type ProspectMapProps = {
  readonly pins: readonly ProspectPin[];
  readonly selectedId: string | null;
  readonly fitKey: string;
  readonly description: string;
  readonly onSelect: (companyId: string) => void;
  readonly children: ReactNode;
};

export const ProspectMap = ({
  pins,
  selectedId,
  fitKey,
  description,
  onSelect,
  children,
}: ProspectMapProps) => {
  const { containerRef, map } = useLeafletMap(true);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  usePinLayer({
    map,
    pins,
    selectedId,
    fitKey,
    view: isDesktop ? DESKTOP_VIEW : MOBILE_VIEW,
    onSelect,
  });
  return (
    <section
      aria-label={description}
      className="fixed inset-x-0 top-0 bottom-[calc(59px+max(14px,env(safe-area-inset-bottom)))] overflow-hidden bg-[#EDF0EA] lg:relative lg:inset-auto lg:min-h-[560px] lg:rounded-xl lg:border lg:border-[#E3E8EF]"
    >
      <div ref={containerRef} className={MAP_CANVAS_CLASS} />
      {children}
      <ZoomButtons map={map} />
      <MapLegend hasCustomers={pins.some((pin) => pin.stage === "customer")} />
    </section>
  );
};
