import type { MarketingPageInput } from "../content-schema";

export const remindersPage: MarketingPageInput = {
  slug: "relances",
  isPublished: false,
  seo: {
    title: "Relances clients pour ramoneurs | Passalio",
    description:
      "Passalio calcule la date du prochain ramonage et prévient vos clients à votre nom. Votre saison se remplit avant septembre.",
  },
  menu: {
    title: "Relances",
    text: "Le client rappelé à l’échéance.",
    icon: "bell",
  },
  eyebrow: "Produit · Relances",
  title: "Vos clients pensent au ramonage avant que vous ayez à les appeler.",
  lead: "Un an après le passage, Passalio prévient le client que c’est le moment. Il vous rappelle, ou prend rendez-vous. Vous remplissez votre saison sans décrocher entre deux conduits.",
  highlights: [
    "Échéance calculée à chaque passage",
    "Mail ou SMS au client",
    "La liste des clients à relancer",
  ],
  screen: {
    backLabel: "Relances",
    status: {
      label: "Septembre",
      tone: "neutral",
    },
    title: "À relancer ce mois",
    subtitle: "38 clients · échéance en septembre",
    rows: [
      {
        label: "Mme Durand",
        value: "Dernier ramonage : 14 sept. 2025",
        tag: "Envoyé",
      },
      {
        label: "M. Laurent",
        value: "Dernier ramonage : 18 sept. 2025",
        tag: "Envoyé",
      },
      {
        label: "SCI Les Tilleuls",
        value: "3 conduits · 22 sept. 2025",
      },
      {
        label: "M. Benali",
        value: "Pas d’email · à appeler",
      },
    ],
    action: "Envoyer les relances",
  },
  pains: [
    {
      title: "Septembre",
      text: "Tout le monde appelle en même temps.",
    },
    {
      title: "Le fichier",
      text: "Qui ai-je ramoné l’an dernier, et quand ?",
    },
    {
      title: "Le client oublié",
      text: "Il est passé chez un autre parce que personne ne l’a prévenu.",
    },
  ],
  featuresTitle: "Une saison préparée en août, pas subie en septembre.",
  features: [
    {
      label: "Échéances",
      title: "Chaque passage prépare le suivant",
      text: "Quand le certificat est signé, Passalio note la date du prochain ramonage. Vous voyez qui arrive à échéance, mois par mois.",
      bullets: [
        "Échéance calculée automatiquement",
        "Vue par mois et par commune",
        "Plusieurs conduits par client",
      ],
      visual: {
        title: "Échéances",
        subtitle: "Septembre à novembre",
        rows: [
          {
            label: "Septembre",
            value: "38 clients",
          },
          {
            label: "Octobre",
            value: "52 clients",
          },
          {
            label: "Novembre",
            value: "27 clients",
          },
        ],
      },
    },
    {
      label: "Message au client",
      title: "Un message simple, signé de votre entreprise",
      text: "Le client reçoit un mail ou un SMS à votre nom. Il vous rappelle ou répond. Vous gardez la main sur le texte.",
      bullets: ["Texte modifiable", "À votre nom et à vos couleurs", "Envoi un par un ou par lot"],
      visual: {
        title: "Message envoyé",
        subtitle: "À Mme Durand",
        status: {
          label: "Mail",
          tone: "validated",
        },
        rows: [
          {
            label: "Objet",
            value: "Votre ramonage annuel",
          },
          {
            label: "Texte",
            value: "Bonjour, votre dernier ramonage date de septembre 2025…",
          },
          {
            label: "Signé",
            value: "Ramonage Martin · 06 12 34 56 78",
          },
        ],
      },
    },
    {
      label: "Suivi",
      title: "Vous savez qui a répondu, et qui appeler",
      text: "Les clients sans email ou sans réponse restent dans une liste. Vous les appelez quand vous avez un moment.",
      bullets: [
        "Statut de chaque relance",
        "Liste des clients à appeler",
        "Rendez-vous créé depuis la relance",
      ],
      visual: {
        title: "Suivi des relances",
        subtitle: "Septembre",
        status: {
          label: "12 à appeler",
          tone: "warning",
        },
        rows: [
          {
            label: "Rendez-vous pris",
            value: "19 clients",
            tag: "Fait",
          },
          {
            label: "Sans réponse",
            value: "7 clients",
          },
          {
            label: "Sans email",
            value: "5 clients · à appeler",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Les relances sont-elles disponibles ?",
      answer: "[Pas encore en production : date à annoncer]",
    },
    {
      question: "Combien coûtent les SMS ?",
      answer: "[À définir avec les prix]",
    },
    {
      question: "Mes clients peuvent-ils refuser les relances ?",
      answer: "Oui. Chaque message permet de ne plus en recevoir, et Passalio s’en souvient.",
    },
  ],
  finalTitle: "Préparez votre prochaine saison sur Passalio.",
};
