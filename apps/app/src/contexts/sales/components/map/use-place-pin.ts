import type { ProspectStage } from "@passalio/shared";
import * as L from "leaflet";
import { useEffect } from "react";
import { placeHaloStyle, placePinStyle } from "./pin-styles";

const PLACE_ZOOM = 13;

type PlacePinOptions = {
  readonly map: L.Map | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly stage: ProspectStage;
};

export const usePlacePin = ({ map, latitude, longitude, stage }: PlacePinOptions) => {
  useEffect(() => {
    if (map === null) {
      return undefined;
    }
    const place: L.LatLngTuple = [latitude, longitude];
    map.setView(place, PLACE_ZOOM, { animate: false });
    const layer = L.layerGroup([
      L.circleMarker(place, placeHaloStyle(stage)),
      L.circleMarker(place, placePinStyle(stage)),
    ]).addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, latitude, longitude, stage]);
};
