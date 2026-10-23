import * as L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import type { ProspectPin } from "../../sales-api";
import { pinStyle, SELECTED_HALO_STYLE, SELECTED_PIN_STYLE } from "./pin-styles";

export type PinView = {
  readonly padding: { readonly topLeft: L.PointTuple; readonly bottomRight: L.PointTuple };
  readonly focusZoom: number | null;
};

type PinLayerOptions = {
  readonly map: L.Map | null;
  readonly pins: readonly ProspectPin[];
  readonly selectedId: string | null;
  readonly fitKey: string;
  readonly view: PinView;
  readonly onSelect: (companyId: string) => void;
};

const latLngOf = (pin: ProspectPin): L.LatLngTuple => [pin.latitude, pin.longitude];

const drawPins = (
  layer: L.LayerGroup,
  pins: readonly ProspectPin[],
  selected: ProspectPin | undefined,
  onSelect: (companyId: string) => void,
) => {
  layer.clearLayers();
  for (const pin of pins) {
    if (pin.id !== selected?.id) {
      L.circleMarker(latLngOf(pin), pinStyle(pin.stage))
        .bindTooltip(pin.name, { direction: "top", offset: [0, -8] })
        .on("click", () => onSelect(pin.id))
        .addTo(layer);
    }
  }
  if (selected !== undefined) {
    L.circleMarker(latLngOf(selected), SELECTED_HALO_STYLE).addTo(layer);
    L.circleMarker(latLngOf(selected), SELECTED_PIN_STYLE)
      .bindTooltip(selected.name, { direction: "top", offset: [0, -11] })
      .addTo(layer);
  }
};

const focus = (map: L.Map, pin: ProspectPin, view: PinView, zoom: number) => {
  const [, top] = view.padding.topLeft;
  const [, bottom] = view.padding.bottomRight;
  const shifted = map.project(latLngOf(pin), zoom).add([0, (bottom - top) / 2]);
  map.setView(map.unproject(shifted, zoom), zoom, { animate: false });
};

const fit = (map: L.Map, pins: readonly ProspectPin[], view: PinView) =>
  map.fitBounds(L.latLngBounds(pins.map(latLngOf)), {
    paddingTopLeft: view.padding.topLeft,
    paddingBottomRight: view.padding.bottomRight,
    animate: false,
  });

export const usePinLayer = ({ map, pins, selectedId, fitKey, view, onSelect }: PinLayerOptions) => {
  const layer = useMemo(() => L.layerGroup(), []);
  const fittedKeyRef = useRef<string | null>(null);
  const selected = pins.find((pin) => pin.id === selectedId);

  useEffect(() => {
    if (map === null) {
      return undefined;
    }
    layer.addTo(map);
    fittedKeyRef.current = null;
    return () => {
      layer.remove();
    };
  }, [map, layer]);

  useEffect(() => {
    drawPins(layer, pins, selected, onSelect);
  }, [layer, pins, selected, onSelect]);

  useEffect(() => {
    if (map === null || pins.length === 0 || fittedKeyRef.current === fitKey) {
      return;
    }
    if (view.focusZoom !== null && selected === undefined) {
      return;
    }
    fittedKeyRef.current = fitKey;
    if (view.focusZoom !== null && selected !== undefined) {
      focus(map, selected, view, view.focusZoom);
      return;
    }
    fit(map, pins, view);
  }, [map, pins, selected, fitKey, view]);

  useEffect(() => {
    if (map === null || selected === undefined) {
      return;
    }
    map.panInside(latLngOf(selected), {
      paddingTopLeft: view.padding.topLeft,
      paddingBottomRight: view.padding.bottomRight,
    });
  }, [map, selected, view]);
};
