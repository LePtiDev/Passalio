import { shortDay, timeOf } from "./calendar-labels";

export type PlatformEnvironment = "production" | "staging" | "local";

export const ENVIRONMENT_LABELS: Readonly<Record<PlatformEnvironment, string>> = {
  production: "Production",
  staging: "Staging",
  local: "Local",
};

const changedOn = (changedAt: string) => `le ${shortDay(changedAt)} à ${timeOf(changedAt)}`;

export const settingsFr = {
  navigation: "Réglages",
  title: "Réglages",
  subtitle:
    "Réglages de Passalio pour tous les comptes de cet environnement. Seuls les super admins voient cette page.",
  back: "Retour à l'accueil",
  open: "Ouvrir les réglages",
  loading: "Chargement des réglages",
  loadError: "Impossible de charger les réglages.",
  journalHint: "Chaque changement est écrit dans le journal. Staging garde son propre réglage.",
  journalHintShort: "Chaque changement est écrit dans le journal.",
  signUp: {
    title: "Inscriptions",
    switchLabel: "Autoriser les inscriptions",
    open: "Ouvertes",
    closed: "Fermées",
    openDescription: "Tout le monde peut créer un compte et une entreprise, avec 7 jours d'essai.",
    closedDescription:
      "Personne ne peut créer de compte sans invitation. Les comptes existants et l'équipe Passalio se connectent normalement.",
    neverChanged: "Ouvertes depuis la mise en ligne.",
    changedBy: (isOpen: boolean, name: string | null, changedAt: string) =>
      `${isOpen ? "Ouvertes" : "Fermées"}${name === null ? "" : ` par ${name}`} ${changedOn(changedAt)}.`,
    allowedTitle: "Toujours possible, même fermées",
    allowed: [
      "Se connecter, mot de passe oublié, lien de connexion",
      "Rejoindre une entreprise sur invitation",
      "Rejoindre l'équipe Passalio sur invitation",
      "Payer son abonnement, exporter ses données",
    ],
    allowedShort: "Se connecter, rejoindre sur invitation, payer, exporter.",
    blockedTitle: "Refusé quand elles sont fermées",
    blocked: ["Créer un compte sans invitation", "Créer une nouvelle entreprise"],
    blockedShort: "Créer un compte ou une entreprise sans invitation.",
    closedToast: "Inscriptions fermées.",
    closedToastDetail: "Les comptes existants se connectent normalement.",
    openedToast: "Inscriptions ouvertes.",
    openedToastDetail: "Tout le monde peut de nouveau créer un compte.",
  },
  closeDialog: {
    title: (environment: string) => `Fermer les inscriptions en ${environment.toLowerCase()} ?`,
    text: (host: string) =>
      `Plus personne ne pourra créer de compte sur ${host}, sauf une personne invitée. Les comptes existants et l'équipe Passalio continuent de se connecter.`,
    cancel: "Annuler",
    submit: "Fermer les inscriptions",
  },
};
