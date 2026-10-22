import type { BrandColor, TeamSize } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";

export const TRADE_LABELS: Readonly<Record<TradeId, { label: string; document: string }>> = {
  chimney_sweeping: { label: "Ramonage", document: "Certificat de ramonage" },
  stove_maintenance: { label: "Entretien de poêle et insert", document: "Attestation d'entretien" },
  boiler_maintenance: {
    label: "Entretien de chaudière",
    document: "Attestation d'entretien annuel",
  },
  heat_pump_maintenance: {
    label: "Pompe à chaleur et climatisation",
    document: "Attestation d'entretien",
  },
  septic_tank_emptying: {
    label: "Vidange de fosse septique",
    document: "Bordereau de suivi des matières de vidange",
  },
};

export const TEAM_SIZE_LABELS: Readonly<Record<TeamSize, string>> = {
  solo: "Seulement moi",
  "2_to_5": "2 à 5",
  "6_to_15": "6 à 15",
  more_than_15: "Plus de 15",
};

export const BRAND_COLOR_LABELS: Readonly<Record<BrandColor, string>> = {
  "#0F2A44": "Nuit",
  "#0E7C5A": "Vert",
  "#B42318": "Rouge",
  "#1D4F91": "Bleu",
  "#334155": "Anthracite",
};

export const onboardingFr = {
  layout: {
    title: "Configuration de votre espace",
    duration: "Environ 3 minutes",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
    stepOf: (step: number, total: number) => `Étape ${step} sur ${total}`,
    steps: [
      { label: "Votre compte", hint: "Email et mot de passe" },
      { label: "Votre entreprise", hint: "Nom, adresse, SIRET" },
      { label: "Vos métiers", hint: "Ramonage, entretien…" },
      { label: "Vos documents", hint: "Logo et numérotation" },
      { label: "Votre équipe", hint: "Facultatif" },
    ],
    back: "Retour",
    continue: "Continuer",
    saving: "Enregistrement…",
    skip: "Passer",
    later: "Plus tard",
  },
  company: {
    title: "Votre entreprise",
    subtitle: "Ces informations figurent en tête de vos attestations et de votre portail client.",
    searchLabel: "Rechercher votre entreprise",
    searchPlaceholder: "Nom, SIREN ou SIRET",
    searchHint: "Données publiques du répertoire Sirene de l'Insee.",
    manualEntry: "Saisir à la main",
    searching: "Recherche…",
    noResult: "Aucune entreprise trouvée. Vérifiez l'orthographe ou saisissez à la main.",
    searchUnavailable: "La recherche est indisponible. Saisissez vos informations à la main.",
    siretLine: (siret: string, city: string) => `SIRET ${siret} · ${city}`,
    nameLabel: "Nom affiché sur les documents",
    siretLabel: "SIRET",
    siretInvalid: "Le SIRET compte 14 chiffres.",
    addressLabel: "Adresse",
    phoneLabel: "Téléphone",
    phonePlaceholder: "04 78 00 00 00",
    teamSizeLabel: "Nombre de techniciens",
    teamSizePlaceholder: "Choisir",
    footnote: "Modifiable à tout moment dans les réglages.",
    nameInvalid: "Le nom doit faire entre 2 et 100 caractères.",
  },
  trades: {
    title: "Vos métiers",
    subtitle:
      "Choisissez ce que vous faites. Chaque métier a ses attestations, avec les mentions obligatoires déjà prévues.",
    legend: "Métiers",
    legalNote:
      "Ramonage : mentions de l'arrêté du 20 juillet 2023. Entretien de chaudière : articles R224-41-4 et suivants du code de l'environnement.",
    selected: (count: number) =>
      count === 0
        ? "Aucun métier choisi"
        : count === 1
          ? "1 métier choisi"
          : `${count} métiers choisis`,
    required: "Choisissez au moins un métier.",
  },
  documents: {
    title: "Vos documents",
    subtitle:
      "Votre logo et votre couleur apparaissent sur les attestations et sur votre portail client.",
    logoLabel: "Logo",
    logoAction: "Importer votre logo",
    logoReplace: "Remplacer le logo",
    logoHint: "PNG ou SVG, 2 Mo maximum. Sans logo, vos initiales sont utilisées.",
    logoUploading: "Envoi du logo…",
    logoTooBig: "Le logo dépasse 2 Mo.",
    logoAlt: "Logo de l'entreprise",
    colorLegend: "Couleur principale",
    prefixLabel: "Numérotation",
    firstNumberLabel: "Premier numéro",
    numberingHint: "Vous changez de logiciel ? Reprenez la suite de vos numéros.",
    numberingInvalid: "Lettres, chiffres, tiret ou barre oblique, 12 caractères au plus.",
    firstNumberInvalid: "Un nombre entre 1 et 999 999.",
    preview: "Aperçu",
    previewCustomer: "Client",
    previewDevice: "Appareil et conduit",
    previewFindings: "Constatations",
    previewTechnicianSignature: "Signature du technicien",
    previewCustomerSignature: "Signature du client",
    previewNumber: (number: string) => `N° ${number}`,
  },
  team: {
    title: "Invitez votre équipe",
    subtitle: "Chacun reçoit un email pour créer son accès. Utilisateurs illimités, sans surcoût.",
    emailColumn: "Adresse email",
    roleColumn: "Rôle",
    emailLabel: (row: number) => `Adresse email ${row}`,
    roleLabel: (row: number) => `Rôle ${row}`,
    removeRow: (row: number) => `Retirer la ligne ${row}`,
    emailPlaceholder: "prenom@exemple.fr",
    addRow: "Ajouter une personne",
    send: (count: number) => (count <= 1 ? "Envoyer l'invitation" : `Envoyer ${count} invitations`),
    sending: "Envoi…",
    sent: (count: number) =>
      count === 1 ? "1 invitation envoyée." : `${count} invitations envoyées.`,
    partlySent: (sent: number, failed: number) =>
      `${sent} envoyée(s), ${failed} en erreur. Vous pourrez réessayer depuis l'écran Équipe.`,
    roles: [
      { role: "technician", text: "Voit sa tournée, remplit et signe les attestations." },
      { role: "secretary", text: "Gère clients, planning et relances. Ne signe pas." },
      { role: "admin", text: "Tout, sauf l'abonnement et la suppression de l'entreprise." },
    ],
    ready: "Votre espace est prêt.",
  },
} as const;
