import type { MarketingPageInput } from "../content-schema";

export const heatingEngineersPage: MarketingPageInput = {
  slug: "chauffagistes-plombiers",
  isPublished: true,
  seo: {
    title: "Ramonage pour chauffagistes et plombiers | Passalio",
    description:
      "Ajoutez le ramonage à votre activité de chauffage sans logiciel lourd : fiches clients, échéances et certificats, prise en main rapide.",
  },
  menu: {
    title: "Chauffagistes et plombiers",
    text: "Le ramonage sans logiciel lourd.",
    icon: "wrench",
  },
  eyebrow: "Pour les chauffagistes et plombiers qui ramonent aussi",
  title: "Le ramonage à côté du chauffage, sans un logiciel lourd en plus.",
  lead: "Quelques centaines de ramonages par an ne méritent pas un ERP. Passalio fait le certificat, l’échéance et la relance. Vos devis et vos factures restent dans votre logiciel.",
  highlights: ["Prêt en une soirée", "Utilisateurs illimités", "Sans engagement"],
  screen: {
    backLabel: "Relances",
    status: {
      label: "Novembre",
      tone: "neutral",
    },
    title: "Échéances du mois",
    subtitle: "38 clients à revoir",
    rows: [
      {
        label: "Mme Durand",
        value: "Poêle à bois · Saint-Maur",
        tag: "Mail envoyé",
      },
      {
        label: "M. Bernard",
        value: "Cheminée ouverte · Créteil",
        tag: "A rappelé",
      },
      {
        label: "SCI Les Tilleuls",
        value: "3 conduits · Vincennes",
        tag: "À relancer",
      },
      {
        label: "M. Laurent",
        value: "Insert · Nogent",
        tag: "Mail envoyé",
      },
    ],
    action: "Voir les 38 échéances",
  },
  pains: [
    {
      title: "Un outil trop gros",
      text: "Votre logiciel gère devis et stock, pas le certificat de ramonage et sa relance.",
    },
    {
      title: "La saison",
      text: "Ramonages et mises en route des chaudières tombent les mêmes semaines.",
    },
    {
      title: "Les clients d’un an",
      text: "Ramonés une fois, jamais relancés, récupérés par le voisin.",
    },
  ],
  featuresTitle: "Un outil à part, simple, pour une activité qui revient chaque année.",
  features: [
    {
      label: "Prise en main",
      title: "Prêt en une soirée, sans formation",
      text: "Vous cherchez votre entreprise par son nom ou son SIRET, vous ajoutez votre logo, et votre premier certificat peut partir le lendemain.",
      bullets: [
        "Entreprise retrouvée dans le répertoire Sirene",
        "Logo, couleur et numérotation réglés une fois",
        "Rien d’autre à paramétrer pour le ramonage",
      ],
      visual: {
        title: "Votre entreprise",
        subtitle: "Étape 2 sur 5",
        status: {
          label: "Trouvée",
          tone: "validated",
        },
        rows: [
          {
            label: "Chauffage Lemoine",
            value: "SIRET 812 345 678 00019",
          },
          {
            label: "Adresse",
            value: "4 avenue Foch, 94300 Vincennes",
          },
          {
            label: "Métiers",
            value: "Ramonage, entretien d’appareil",
          },
          {
            label: "Numérotation",
            value: "Commence à 2026-0001",
          },
        ],
      },
    },
    {
      label: "Échéances",
      title: "La saison de ramonage se prépare avant septembre",
      text: "Chaque mois, Passalio liste les clients à revoir et leur écrit à votre nom. Vous voyez qui a répondu et qui reste à appeler.",
      bullets: [
        "Clients à revoir, mois par mois",
        "Relance par mail automatique",
        "Ceux qui ont pris rendez-vous sortent de la liste",
      ],
      visual: {
        title: "Septembre",
        subtitle: "Échéances à venir",
        status: {
          label: "64 clients",
          tone: "neutral",
        },
        rows: [
          {
            label: "Mails envoyés",
            value: "Le 1er septembre",
            tag: "64",
          },
          {
            label: "Rendez-vous pris",
            value: "Par téléphone ou par mail",
            tag: "23",
          },
          {
            label: "À appeler",
            value: "Sans réponse après 10 jours",
            tag: "41",
          },
        ],
      },
    },
    {
      label: "Équipe",
      title: "Vos plombiers ramonent aussi, chacun avec son accès",
      text: "Chaque technicien a son compte et sa tournée. Pas de supplément par personne.",
      bullets: [
        "Utilisateurs illimités",
        "Planning partagé jour, semaine et équipe",
        "Certificat au nom de celui qui a fait le passage",
      ],
      visual: {
        title: "Équipe",
        subtitle: "Chauffage Lemoine",
        status: {
          label: "5 membres",
          tone: "neutral",
        },
        rows: [
          {
            label: "Marc Lemoine",
            value: "Gérant",
            tag: "Patron",
          },
          {
            label: "Nadia Lemoine",
            value: "Bureau",
            tag: "Secrétariat",
          },
          {
            label: "Tom, Hugo, Yanis",
            value: "Plombiers chauffagistes",
            tag: "Techniciens",
          },
        ],
      },
    },
    {
      label: "Vos données",
      title: "À côté de votre logiciel, pas à sa place",
      text: "Passalio ne touche ni à vos devis ni à vos factures. Vos clients et vos certificats restent exportables à tout moment.",
      bullets: [
        "Export des clients et des certificats",
        "Hébergé en Europe",
        "Sans engagement, arrêt quand vous voulez",
      ],
      visual: {
        title: "Exporter",
        subtitle: "Vos données Passalio",
        rows: [
          {
            label: "Clients et appareils",
            value: "Fichier CSV",
            tag: "CSV",
          },
          {
            label: "Certificats signés",
            value: "Tous les PDF",
            tag: "PDF",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Et l’entretien des chaudières gaz ou fioul ?",
      answer:
        "Pas encore. Passalio couvre le ramonage et l’entretien des appareils à bois. Les autres métiers viendront ensuite.",
    },
    {
      question: "Puis-je exporter mes données ?",
      answer: "Oui : vos clients et vos certificats, en fichier ou en PDF.",
    },
    {
      question: "Mes techniciens doivent-ils installer quelque chose ?",
      answer:
        "Non. Passalio s’ouvre dans le navigateur du téléphone et s’ajoute à l’écran d’accueil.",
    },
  ],
  finalTitle: "Essayez-le avant la saison.",
};
