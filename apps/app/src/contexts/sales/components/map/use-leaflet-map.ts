import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { useCallback, useState } from "react";
import { salesFr } from "../../fr";

const IGN_TILES =
  "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png";

export const MAP_CANVAS_CLASS =
  "absolute inset-0 z-0 bg-[#EDF0EA]! font-[inherit]! [&_.leaflet-tile-pane]:brightness-105 [&_.leaflet-tile-pane]:contrast-90 [&_.leaflet-tile-pane]:saturate-[.35]";

const FRANCE_CENTER: L.LatLngTuple = [46.6, 2.4];

const FRANCE_ZOOM = 6;

const MIN_ZOOM = 5;

const MAX_ZOOM = 18;

export const useLeafletMap = (isInteractive: boolean) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const containerRef = useCallback(
    (container: HTMLDivElement) => {
      const created = L.map(container, {
        zoomControl: false,
        dragging: isInteractive,
        touchZoom: isInteractive,
        scrollWheelZoom: isInteractive,
        doubleClickZoom: isInteractive,
        boxZoom: isInteractive,
        keyboard: isInteractive,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      }).setView(FRANCE_CENTER, FRANCE_ZOOM);
      created.attributionControl.setPrefix(false);
      L.tileLayer(IGN_TILES, {
        attribution: salesFr.prospection.attribution,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      }).addTo(created);
      setMap(created);
      return () => {
        created.remove();
        setMap(null);
      };
    },
    [isInteractive],
  );
  return { containerRef, map };
};
