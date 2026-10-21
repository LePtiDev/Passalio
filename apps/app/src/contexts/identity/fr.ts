import type { OrganizationRole } from "@passalio/shared";

export const ROLE_LABELS: Readonly<Record<OrganizationRole, string>> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  secretary: "Secrétariat",
  technician: "Technicien",
};

export const identityFr = {
  signIn: {
    title: "Connexion",
    subtitle: "Recevez un lien de connexion par email. Pas de mot de passe à retenir.",
    emailLabel: "Adresse email",
    emailPlaceholder: "vous@exemple.fr",
    submit: "Recevoir le lien",
    sending: "Envoi en cours…",
    invalidEmail: "Saisissez une adresse email valide.",
    checkInboxTitle: "Vérifiez votre boîte mail",
    checkInbox: (email: string) =>
      `Nous avons envoyé un lien de connexion à ${email}. Il est valable 15 minutes.`,
    otherEmail: "Utiliser une autre adresse",
  },
  newOrganization: {
    title: "Créez votre entreprise",
    subtitle: "Le nom apparaîtra sur vos attestations. Vous pourrez le modifier plus tard.",
    nameLabel: "Nom de l'entreprise",
    namePlaceholder: "Ramonage Dupont",
    submit: "Créer l'entreprise",
    creating: "Création…",
    created: (name: string) => `${name} est créée. Vous pouvez inviter votre équipe.`,
  },
  team: {
    title: "Équipe",
    subtitle: "Les personnes qui ont accès à votre entreprise.",
    you: "Vous",
    loadMore: "Voir plus",
    emptyTitle: "Vous êtes seul pour l'instant",
    emptyText: "Invitez vos techniciens et votre secrétariat. Ils recevront un lien par email.",
    emptyAction: "Inviter une personne",
    roleLabel: (name: string) => `Rôle de ${name}`,
    roleChanged: (name: string, role: string) => `${name} est maintenant ${role.toLowerCase()}.`,
    remove: "Retirer",
    removeTitle: (name: string) => `Retirer ${name} de l'équipe ?`,
    removeText:
      "Cette personne n'aura plus accès à l'entreprise. Ses attestations restent conservées.",
    removeConfirm: "Retirer",
    removed: (name: string) => `${name} a été retiré de l'équipe.`,
    cancel: "Annuler",
    transfer: "Transférer la propriété",
    transferTitle: (name: string) => `Transférer la propriété à ${name} ?`,
    transferText:
      "Cette personne gérera l'abonnement et pourra supprimer le compte. Vous deviendrez administrateur.",
    transferConfirm: "Transférer",
    transferred: (name: string) => `${name} est maintenant propriétaire.`,
  },
  invite: {
    title: "Inviter une personne",
    emailLabel: "Adresse email",
    roleLabel: "Rôle",
    submit: "Envoyer l'invitation",
    sending: "Envoi…",
    sent: (email: string) => `Invitation envoyée à ${email}. Elle est valable 7 jours.`,
  },
  invitation: {
    title: "Rejoindre l'équipe",
    text: "Vous avez été invité à rejoindre une entreprise sur Passalio.",
    accept: "Accepter l'invitation",
    accepting: "Validation…",
    accepted: "Bienvenue dans l'équipe.",
  },
} as const;
