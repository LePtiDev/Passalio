import type { ProspectStage } from "@passalio/shared";
import type { CircleMarkerOptions } from "leaflet";
import { STAGE_COLORS } from "../stage-colors";

const WHITE = "#FFFFFF";

const SELECTED_COLOR = "#0F2A44";

export const pinStyle = (stage: ProspectStage): CircleMarkerOptions => ({
  radius: 8,
  color: WHITE,
  weight: 2,
  fillColor: STAGE_COLORS[stage],
  fillOpacity: 1,
});

export const SELECTED_PIN_STYLE: CircleMarkerOptions = {
  radius: 11,
  color: WHITE,
  weight: 3,
  fillColor: SELECTED_COLOR,
  fillOpacity: 1,
};

export const SELECTED_HALO_STYLE: CircleMarkerOptions = {
  radius: 22,
  stroke: false,
  fillColor: SELECTED_COLOR,
  fillOpacity: 0.14,
  interactive: false,
};

export const placePinStyle = (stage: ProspectStage): CircleMarkerOptions => ({
  radius: 7,
  color: WHITE,
  weight: 2.5,
  fillColor: STAGE_COLORS[stage],
  fillOpacity: 1,
});

export const placeHaloStyle = (stage: ProspectStage): CircleMarkerOptions => ({
  radius: 16,
  stroke: false,
  fillColor: STAGE_COLORS[stage],
  fillOpacity: 0.16,
  interactive: false,
});
