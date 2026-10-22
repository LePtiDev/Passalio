import { DATA_PROCESSING_SECTION } from "./data-processing-fr";
import type { LegalDocument } from "./legal-document";
import { TERMS_CLAUSE_SECTIONS } from "./terms-clauses-fr";
import { TERMS_SERVICE_SECTIONS } from "./terms-service-fr";

export const TERMS_FR: LegalDocument = {
  title: "Conditions générales d'utilisation et de vente",
  sections: [...TERMS_SERVICE_SECTIONS, ...TERMS_CLAUSE_SECTIONS, DATA_PROCESSING_SECTION],
};
