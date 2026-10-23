import type { CertificateError } from "@passalio/trades";

export type ComplianceError =
  | CertificateError
  | "already_exists"
  | "unknown_template"
  | "intervention_not_found"
  | "intervention_closed"
  | "equipment_not_found"
  | "equipment_not_in_intervention"
  | "number_not_reserved"
  | "number_taken"
  | "cancelled_document_not_found"
  | "document_already_cancelled";
