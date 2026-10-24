import type { PlatformRole } from "@passalio/shared";

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

const ELIDED_INITIAL = /^[aeiouyhàâäéèêëîïôöûüù]/iu;

const ofName = (name: string) => (ELIDED_INITIAL.test(name) ? `d'${name}` : `de ${name}`);

export const PLATFORM_ROLE_LABELS: Readonly<Record<PlatformRole, string>> = {
  superadmin: "Super admin",
  admin: "Admin",
  sales: "Commercial",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Readonly<Record<PlatformRole, string>> = {
  superadmin:
    "Tout l'espace admin, y compris inviter, changer le rôle ou retirer des membres de l'équipe.",
  admin:
    "Tout l'espace admin sauf l'équipe : comptes clients, accès, se connecter à la place d'un client, bloquer un compte, journal.",
  sales: "Entreprises, contacts et prospection. Ne voit pas les comptes clients.",
};

export const teamFr = {
  navigation: "Équipe Passalio",
  navigationShort: "Équipe",
  title: "Équipe Passalio",
  subtitle: (members: number, invitations: number) =>
    invitations === 0
      ? `${plural(members, "membre", "membres")}. Seuls les super admins voient cette page.`
      : `${plural(members, "membre", "membres")}, ${plural(invitations, "invitation en attente", "invitations en attente")}. Seuls les super admins voient cette page.`,
  subtitleLoading: "Les membres de l'équipe et leurs rôles.",
  mobileSubtitle: (members: number) => plural(members, "membre", "membres"),
  invite: "Inviter un membre",
  membersTitle: "Membres",
  columns: {
    member: "Membre",
    role: "Rôle",
    lastSignIn: "Dernière connexion",
    twoFactor: "Double authentification",
  },
  twoFactorOn: "Activée",
  twoFactorOff: "À activer",
  afterJoining: "Après acceptation",
  never: "Jamais",
  today: (time: string) => `Aujourd'hui, ${time}`,
  yesterday: (time: string) => `Hier, ${time}`,
  you: "C'est vous",
  youShort: "vous",
  changeRole: "Changer le rôle",
  remove: "Retirer",
  memberActionsPrefix: "Actions pour",
  memberActions: (name: string) => `Actions pour ${name}`,
  mobileHint: "Touchez un membre pour changer son rôle ou le retirer.",
  invitationsTitle: "Invitations en attente",
  noInvitation: "Aucune invitation en attente.",
  invitedBy: (name: string, date: string) => `Invitée par ${name} le ${date}`,
  invitedOn: (date: string) => `Invitation du ${date}`,
  expiresIn: (days: number) =>
    days <= 0 ? "Expirée" : `Expire dans ${plural(days, "jour", "jours")}`,
  resend: "Renvoyer",
  cancel: "Annuler",
  resent: (email: string) => `Invitation renvoyée à ${email}.`,
  canceled: (email: string) => `Invitation à ${email} annulée.`,
  loadError: "Impossible de charger l'équipe. Vérifiez votre connexion et réessayez.",
  back: "Retour",
  inviteDialog: {
    title: "Inviter un membre de l'équipe Passalio",
    mobileTitle: "Inviter un membre",
    text: "La personne reçoit un e-mail pour rejoindre l'équipe. Le lien est valable 7 jours.",
    emailLabel: "E-mail",
    emailPlaceholder: "prenom@passalio.com",
    invalidEmail: "Saisissez une adresse e-mail valide.",
    roleLabel: "Rôle",
    submit: "Envoyer l'invitation",
    sending: "Envoi…",
    sent: (email: string) => `Invitation envoyée à ${email}.`,
  },
  roleDialog: {
    title: (name: string) => `Changer le rôle ${ofName(name)}`,
    mobileTitle: "Changer le rôle",
    text: (name: string) =>
      `Le nouveau rôle s'applique tout de suite. ${name} devra se reconnecter.`,
    current: "rôle actuel",
    submit: "Changer le rôle",
    saving: "Enregistrement…",
    changed: (name: string, role: string) => `${name} est maintenant ${role}.`,
  },
  removeDialog: {
    title: (name: string) => `Retirer ${name} de l'équipe ?`,
    text: (name: string) =>
      `${name} perd l'accès à l'espace admin et ses sessions sont fermées. Son compte reste, vous pourrez l'inviter de nouveau.`,
    submit: "Retirer de l'équipe",
    removed: (name: string) => `${name} ne fait plus partie de l'équipe.`,
  },
  join: {
    title: "Rejoindre l'équipe Passalio",
    showcaseBadge: "Espace admin",
    showcaseTitle: "Bienvenue dans l'équipe. Chaque accès aux comptes est protégé et journalisé.",
    invalidShowcaseTitle: "Chaque accès aux comptes est protégé et journalisé.",
    text: (inviter: string | null) =>
      inviter === null ? "Vous êtes invité comme" : `${inviter} vous invite comme`,
    signedInAs: (email: string) => `Vous êtes connecté avec ${email}.`,
    nextTitle: "Ensuite",
    nextText:
      "Vous activerez la double authentification avec une application comme Google Authenticator. Elle est obligatoire pour entrer dans l'espace admin.",
    submit: "Rejoindre l'équipe",
    joining: "Un instant…",
    switchAccount: "Ce n'est pas mon adresse : changer de compte",
    joined: "Bienvenue dans l'équipe Passalio.",
    invalidTitle: "Cette invitation n'est plus valable",
    invalidText:
      "Le lien a expiré, a été annulé ou a déjà servi. Demandez une nouvelle invitation à la personne qui vous l'a envoyée.",
    mismatchTitle: "Cette invitation est pour une autre adresse",
    mismatchText: (invited: string, current: string) =>
      `Elle a été envoyée à ${invited}. Vous êtes connecté avec ${current}.`,
    home: "Retour à l'accueil",
    switchTo: "Changer de compte",
  },
} as const;
