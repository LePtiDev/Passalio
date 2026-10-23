export const fr = {
  layout: {
    tagline: "Passalio · Chaque passage, en règle.",
    buttonFallback: "Le bouton ne marche pas ?",
  },
  magicLink: {
    subject: "Votre lien de connexion",
    title: "Votre lien de connexion",
    lead: "Un clic et vous êtes connecté.",
    action: "Me connecter",
    validity: "Valable 15 minutes",
    safety: "Pas vous ? Ignorez cet e-mail.",
  },
  passwordReset: {
    subject: "Choisissez un nouveau mot de passe",
    title: "Nouveau mot de passe",
    lead: "Choisissez-le en un clic.",
    action: "Choisir mon mot de passe",
    validity: "Valable 1 heure",
    safety: "Pas vous ? Ignorez cet e-mail, rien ne change.",
  },
  invitation: {
    subject: (inviterName: string) => `${inviterName} vous invite sur Passalio`,
    subjectWithoutInviter: (organizationName: string) =>
      `Rejoignez ${organizationName} sur Passalio`,
    invitedBy: (inviterName: string) => `${inviterName} vous invite`,
    title: "Rejoignez l'équipe",
    lead: "Vos attestations, au même endroit que vos collègues.",
    action: "Rejoindre l'équipe",
    validity: "Valable 7 jours",
    safety: "Vous ne connaissez pas cette entreprise ? Ignorez cet e-mail.",
  },
} as const;
