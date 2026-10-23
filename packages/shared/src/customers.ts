export const CUSTOMER_KINDS = ["individual", "company"] as const;

export type CustomerKind = (typeof CUSTOMER_KINDS)[number];

export const CIVILITIES = ["mrs", "mr"] as const;

export type Civility = (typeof CIVILITIES)[number];

export const BUILDING_TYPES = ["house", "apartment", "business"] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export const EQUIPMENT_STATUSES = ["active", "removed"] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const EQUIPMENT_PHOTO_KINDS = ["plate", "overview"] as const;

export type EquipmentPhotoKind = (typeof EQUIPMENT_PHOTO_KINDS)[number];

export const EQUIPMENT_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const EQUIPMENT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const CALENDAR_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const EQUIPMENT_KINDS = [
  "open_fireplace",
  "insert",
  "log_stove",
  "pellet_stove",
  "boiler",
  "solid_fuel_cooker",
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
] as const;

export type EquipmentKind = (typeof EQUIPMENT_KINDS)[number];

export const ENERGIES = ["wood_logs", "pellets", "gas", "oil", "coal", "electricity"] as const;

export type Energy = (typeof ENERGIES)[number];
