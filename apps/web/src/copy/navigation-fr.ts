export const navigationFr = {
  label: "Navigation principale",
  homeLink: "Passalio, accueil",
  product: "Produit",
  activity: "Activité",
  stories: "Histoires",
  signIn: "Se connecter",
  tryFree: "Essayer gratuitement",
  tryShort: "Essayer",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  productHighlight: {
    eyebrow: "Un passage",
    title: "Du rendez-vous à la relance, en 4 temps",
    text: "Avant de sonner, sur place, en partant, onze mois plus tard.",
  },
  activityHighlight: {
    eyebrow: "Votre activité",
    title: "Fait pour les pros du ramonage",
    text: "Seul ou en équipe, chaque passage en règle.",
  },
  allStories: "Toutes les histoires",
} as const;

export const footerFr = {
  label: "Liens du pied de page",
  activity: "Activité",
  product: "Produit",
  company: "Passalio",
  legal: "Légal",
  home: "Accueil",
  stories: "Histoires",
  signIn: "Se connecter",
  terms: "Conditions",
  privacy: "Confidentialité",
  legalNotice: "Mentions légales",
  copyright: (year: number) => `© ${year} Passalio`,
} as const;
