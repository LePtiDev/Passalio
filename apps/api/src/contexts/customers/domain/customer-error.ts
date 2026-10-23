export type CustomerError =
  | "customer_not_found"
  | "site_not_found"
  | "equipment_not_found"
  | "photo_not_found"
  | "customer_name_required"
  | "already_exists"
  | "equipment_kind_not_offered"
  | "invalid_equipment_details"
  | "equipment_already_removed"
  | "invalid_photo";
