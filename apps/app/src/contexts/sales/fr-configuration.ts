import type { MailProvider, PlatformRole, SmtpPort } from "@passalio/shared";

const PROVIDERS: Readonly<Record<MailProvider, string>> = {
  zoho: "Zoho Mail",
  ovh_email_pro: "OVH Email Pro",
  ovh_mx_plan: "OVH MX Plan",
  google: "Google Workspace",
  other: "Autre",
};

const PORTS: Readonly<Record<SmtpPort, string>> = {
  465: "465 (SSL)",
  587: "587 (STARTTLS)",
};

const ROLES: Readonly<Record<PlatformRole, string>> = {
  superadmin: "super admin",
  admin: "admin",
  sales: "commercial",
};

export const configurationFr = {
  title: "Configuration",
  subtitle: (name: string, role: PlatformRole) => `${name} · ${ROLES[role]}`,
  mobileSubtitle: (rubric: string, name: string) => (name === "" ? rubric : `${rubric} · ${name}`),
  backToDay: "Retour à Ma journée",
  open: "Configuration",
  member: "Membre",
  memberOption: (name: string, isSelf: boolean) => (isSelf ? `${name} (vous)` : name),
  save: "Enregistrer",
  saving: "Enregistrement…",
  saved: "Configuration enregistrée.",
  rubrics: "Rubriques",
  tabs: {
    profil: "Profil",
    boite: "Boîte mail",
    rappels: "Rappels",
    signature: "Signature",
  },
  loading: "Chargement de la configuration",
  loadFailed: "La configuration n'a pas pu être chargée.",
  profile: {
    title: "Profil",
    hint: "Le compte Passalio de ce membre.",
    name: "Nom",
    email: "Adresse de connexion",
    role: "Rôle",
    roles: ROLES,
  },
  sender: {
    title: "Adresse d'envoi",
    hint: "Ce que voit la personne qui reçoit votre mail.",
    senderName: "Nom affiché",
    senderAddress: "Adresse",
    provider: "Fournisseur",
    providerHint: "Remplit le serveur et le port tout seul.",
    replyTo: "Adresse de réponse",
    replyToHint: "En général la même.",
  },
  providers: PROVIDERS,
  ports: PORTS,
  connection: {
    title: "Connexion",
    hint: "Passalio envoie à votre place depuis cette boîte. Le mot de passe est chiffré et ne s'affiche plus.",
    host: "Serveur d'envoi",
    port: "Port",
    username: "Identifiant",
    password: "Mot de passe d'application",
    passwordHint: "Pas le mot de passe habituel.",
    passwordSaved: (day: string) => `Enregistré le ${day} · laissez vide pour le garder`,
    test: "Tester la connexion",
    testing: "Test en cours…",
    saveFirst: "Enregistrez avant de tester.",
    verified: (when: string) => `Connexion réussie. Dernier test : ${when}.`,
    testSent: (address: string) => `Mail de test envoyé à ${address}.`,
    appPassword: {
      zoho: "Créer un mot de passe d'application Zoho",
      google: "Créer un mot de passe d'application Google",
    },
  },
  reminders: {
    title: "Rappels",
    hint: "Les rappels programmés après un appel.",
    notify: "Notification par défaut",
    address: "Adresse des rappels",
    addressHint: "Vide : l'adresse de connexion.",
  },
  signature: {
    title: "Signature",
    hint: "Ajoutée à la fin de vos mails.",
    label: "Signature",
  },
  status: {
    connected: "Boîte connectée",
    untested: "Boîte à tester",
    none: "Aucune boîte",
    line: (address: string, provider: string) => `${address} · ${provider}`,
    untestedLine: "Testez la connexion avant d'envoyer des mails.",
    noneLine: "Renseignez la boîte mail pour envoyer des mails.",
  },
  otherMember: {
    title: (name: string) => `Vous modifiez la configuration de ${name}.`,
    text: (name: string) =>
      `Chaque changement est inscrit au journal et ${name} reçoit un mail qui le résume. Vous ne voyez jamais son mot de passe de boîte, vous pouvez seulement le remplacer.`,
  },
  errors: {
    required: "Champ obligatoire.",
    email: "Adresse e-mail invalide.",
    host: "Serveur invalide, par exemple smtp.zoho.eu.",
    tooLong: "Texte trop long.",
  },
} as const;
