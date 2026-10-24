export type SchedulingError =
  | "already_exists"
  | "intervention_not_found"
  | "site_not_found"
  | "customer_not_found"
  | "equipment_not_found"
  | "technician_not_member"
  | "intervention_closed"
  | "invalid_visit_type";
