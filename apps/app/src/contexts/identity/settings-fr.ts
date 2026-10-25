import type { DocumentTemplate } from "@passalio/shared";
import type { LegalForm, LegalMention, RegistryKind } from "@passalio/trades";

export const LEGAL_FORM_LABELS: Readonly<Record<LegalForm, string>> = {
  ei: "Entreprise individuelle (EI)",
  eurl: "EURL",
  sarl: "SARL",
  sasu: "SASU",
  sas: "SAS",
  sa: "SA",
  other: "Autre forme",
};

export const LEGAL_FORM_SHORT_LABELS: Readonly<Record<LegalForm, string | null>> = {
  ei: "EI",
  eurl: "EURL",
  sarl: "SARL",
  sasu: "SASU",
  sas: "SAS",
  sa: "SA",
  other: null,
};

export const REGISTRY_LABELS: Readonly<Record<RegistryKind, string>> = {
  rcs: "RCS (registre du commerce)",
  rne: "Registre national des entreprises",
};

export const LEGAL_MENTION_LABELS: Readonly<Record<LegalMention, string>> = {
  name: "raison sociale",
  legalForm: "forme juridique",
  siret: "SIRET",
  shareCapitalEuros: "capital social",
  registry: "immatriculation",
  address: "adresse du siège",
};

export const TEMPLATE_TEXTS: Readonly<
  Record<DocumentTemplate, { readonly label: string; readonly text: string }>
> = {
  banner: { label: "Bandeau", text: "En-tête plein, à votre couleur" },
  plain: { label: "Sobre", text: "Fond blanc, filet de couleur" },
};

export const settingsFr = {
  settings: "Réglages",
  backToSettings: "Retour aux réglages",
  unsavedChanges: (count: number) =>
    count === 1 ? "1 changement non enregistré" : `${count} changements non enregistrés`,
  noChanges: "Aucun changement",
  cancel: "Annuler",
  save: "Enregistrer",
  saving: "Enregistrement…",
  saved: "Réglages enregistrés.",
  saveFailed: "Vos réglages n'ont pas pu être enregistrés.",
  loadFailed: "Vos réglages n'ont pas pu être chargés",
  loadFailedText: "Vérifiez votre connexion puis réessayez.",
  loading: "Chargement des réglages",
  readOnly: "Seuls le propriétaire et les administrateurs peuvent modifier ces réglages.",
  fieldsToFix: (count: number) =>
    count === 1 ? "1 champ à corriger." : `${count} champs à corriger.`,
  company: {
    title: "Entreprise",
    intro: "Ces informations figurent en bas de chaque certificat.",
    missingTitle: "À compléter avant votre premier certificat",
    missingText:
      "La loi impose ces mentions sur le certificat. Tant qu'elles manquent, vos techniciens peuvent faire le passage mais pas signer le certificat.",
    legalIdentity: "Identité légale",
    name: "Raison sociale",
    legalForm: "Forme juridique",
    legalFormPlaceholder: "Choisir",
    siret: "SIRET",
    siretHint: "Les 9 premiers chiffres, le SIREN, figurent sur le certificat.",
    shareCapital: "Capital social (€)",
    shareCapitalHint: "Demandé pour une société (SAS, SARL…).",
    registry: "Immatriculation",
    registryPlaceholder: "Choisir",
    registryHint: "RCS pour une société ou un commerçant, registre national pour un artisan.",
    registryCity: "Ville du greffe",
    apeCode: "Code APE",
    address: "Adresse du siège",
    previewTitle: "Où ces informations apparaissent",
    previewLabel: "Bas de page du certificat",
    toFix: "à corriger",
    line: {
      capital: (euros: string) => `au capital de ${euros}\u00A0€`,
      capitalLabel: "au capital de",
      siren: "· SIREN",
      rcs: (city: string) => `RCS ${city}`,
      rcsLabel: "RCS",
      rne: "RNE",
      headOffice: "· siège :",
    },
    fieldNote:
      "Sur le terrain, le technicien ne peut pas signer le certificat tant que ces informations manquent. Il voit : « Les informations de l'entreprise sont incomplètes. Prévenez votre gérant. »",
    errors: {
      name: "Indiquez la raison sociale, 2 caractères minimum.",
      legalForm: "Choisissez la forme juridique.",
      siret: "Le SIRET compte 14 chiffres.",
      shareCapital: "Indiquez le capital social, en euros.",
      registry: "Choisissez l'immatriculation.",
      registryCity: "Indiquez la ville du greffe.",
      apeCode: "Le code APE compte 4 chiffres et une lettre, par exemple 4322B.",
      address: "Indiquez l'adresse du siège.",
    },
  },
  documents: {
    title: "Documents",
    intro: "L'apparence de vos certificats. Les certificats déjà signés ne changent pas.",
    template: "Modèle",
    logoAndColor: "Logo et couleur",
    replaceLogo: "Remplacer",
    addLogo: "Ajouter un logo",
    removeLogo: "Retirer",
    uploadingLogo: "Envoi du logo…",
    logoHint: "PNG, JPG, WebP ou SVG, 2 Mo maximum. Fond transparent conseillé.",
    logoTooBig: "Ce logo dépasse 2 Mo. Choisissez une image plus légère.",
    logoFailed: "Le logo n'a pas pu être enregistré.",
    logoRemoved: "Logo retiré.",
    color: "Couleur de vos documents",
    contact: "Coordonnées affichées",
    contactText: "Elles s'affichent dans l'en-tête de chaque document. Laissez vide pour masquer.",
    phone: "Téléphone",
    email: "E-mail",
    website: "Site web",
    qualification: "Qualification",
    qualificationHint: "Affichée à côté du nom du technicien qui signe.",
    texts: "Textes",
    customerMessage: "Message au client",
    customerMessageHint: "En bas de la dernière page. 300 caractères maximum.",
    footerText: "Pied de page",
    footerTextHint: "Assurance, médiation de la consommation, mentions de votre choix.",
    advice: "Page de conseils",
    adviceText:
      "Conseils d'usage et d'entretien adaptés à l'appareil. Ajoutés automatiquement pour les appareils à combustible solide hors chaudière, comme le prévoit l'article R. 1331-77.",
    numbering: "Numérotation",
    prefix: "Préfixe",
    nextNumber: "Prochain numéro",
    nextCertificate: (number: string) => `Prochain certificat : ${number}.`,
    numberingText: "Les numéros se suivent sans trou, même hors ligne.",
    numberingLocked:
      "Des numéros sont déjà attribués : le prochain numéro peut seulement augmenter.",
    previewTitle: "Aperçu avec un exemple",
    previewUpdated: "Mis à jour à chaque changement.",
    previewButton: "Aperçu",
    previewClose: "Fermer l'aperçu",
    previewBack: "Revenir aux réglages",
    previewNote: "Exemple fictif.",
    previewFailed: "L'aperçu n'a pas pu être affiché.",
    previewLoading: "Préparation de l'aperçu",
    previewMissingCompany: "Exemple avec des informations légales fictives : complétez",
    previewMissingCompanyLink: "la page Entreprise",
    page: (number: number) => `Page ${number}`,
    errors: {
      email: "Indiquez un e-mail valide, par exemple contact@exemple.fr.",
      prefix: "12 caractères maximum : lettres, chiffres, - / _",
      nextNumber: "Indiquez un nombre entre 1 et 999 999.",
      numberAlreadyUsed: "Ce numéro est déjà attribué. Choisissez un numéro plus grand.",
      tooLong: "300 caractères maximum.",
    },
  },
} as const;
