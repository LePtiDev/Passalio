import { TERMS_VERSION } from "@passalio/shared";

export const LEGAL_PUBLICATION_DATE = "[date de mise en ligne]";

export const PUBLISHER = {
  name: "[raison sociale ou nom de l'entrepreneur, à compléter]",
  legalForm: "[forme juridique et capital social, à compléter]",
  address: "[adresse du siège, à compléter]",
  registration: "[SIREN et registre, à compléter]",
  vat: "[numéro de TVA intracommunautaire ou mention de franchise, à compléter]",
  email: "[email de contact, à compléter]",
  phone: "[téléphone, à compléter]",
  publicationDirector: "[directeur de la publication, à compléter]",
  priceTaxBasis: "[HT ou TTC selon le régime de TVA, à compléter]",
  courtCity: "[ville du siège, à compléter]",
} as const;

export const legalFr = {
  backToApp: "Retour à Passalio",
  back: "Retour",
  tableOfContents: "Sommaire",
  documentsNavigation: "Documents légaux",
  version: `Version ${TERMS_VERSION} · en vigueur le ${LEGAL_PUBLICATION_DATE}`,
  copyright: "© 2026 Passalio",
  links: {
    terms: "Conditions",
    privacy: "Confidentialité",
    legalNotice: "Mentions légales",
  },
  acceptTerms: {
    before: "J'accepte les",
    terms: "conditions d'utilisation",
    between: "et la",
    privacy: "politique de confidentialité",
    after: ".",
    opensInNewTab: "(s'ouvre dans un nouvel onglet)",
  },
} as const;
