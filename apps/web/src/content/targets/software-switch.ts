import type { MarketingPageInput } from "../content-schema";

export const softwareSwitchPage: MarketingPageInput = {
  slug: "changer-de-logiciel",
  isPublished: false,
  seo: {
    title: "Changer de logiciel de ramonage | Passalio",
    description:
      "Reprise accompagnée de vos clients, de leurs appareils et de leurs échéances. Toute l’équipe au même prix, sans engagement.",
  },
  menu: {
    title: "Changer de logiciel",
    text: "Clients et échéances repris avec vous.",
    icon: "swap",
  },
  eyebrow: "Vous utilisez déjà un logiciel de ramonage",
  title: "Changer de logiciel sans perdre un client ni une échéance.",
  lead: "On reprend vos clients, leurs appareils et les dates de leurs derniers passages, avec vous. Ensuite, tout continue : mêmes relances, même historique, toute l’équipe au même prix.",
  highlights: ["Reprise accompagnée", "Utilisateurs illimités", "Sans engagement"],
  screen: {
    backLabel: "Import",
    status: {
      label: "Fichier reçu",
      tone: "validated",
    },
    title: "Reprise de vos clients",
    subtitle: "export-clients.xlsx",
    rows: [
      {
        label: "412 clients",
        value: "Noms, adresses, téléphones",
        tag: "Prêts",
      },
      {
        label: "498 appareils",
        value: "Type, combustible, conduit",
        tag: "Prêts",
      },
      {
        label: "Dates de passage",
        value: "Échéances recalculées",
        tag: "Prêtes",
      },
      {
        label: "6 lignes à vérifier",
        value: "Adresse incomplète",
      },
    ],
    action: "Importer 412 clients",
  },
  pains: [
    {
      title: "Le prix par compte",
      text: "Si chaque technicien coûte en plus, l’apprenti finit sur le compte du patron.",
    },
    {
      title: "Le réseau",
      text: "Si l’application attend le réseau, la cave redevient une journée papier.",
    },
    {
      title: "La peur de changer",
      text: "Des années de clients et d’échéances : on reste, faute de mieux.",
    },
  ],
  featuresTitle: "On reprend vos données avec vous, puis tout continue.",
  features: [
    {
      label: "Reprise",
      title: "Vos clients repris et vérifiés avant l’import",
      text: "Vous envoyez l’export de votre outil actuel. On regarde le fichier ensemble, les lignes douteuses sont signalées, rien n’est écrasé.",
      bullets: [
        "Fichier Excel ou CSV",
        "Lignes à vérifier signalées avant l’import",
        "Antho au téléphone pendant la reprise si vous voulez",
      ],
      visual: {
        title: "Vérification",
        subtitle: "export-clients.xlsx",
        status: {
          label: "6 à vérifier",
          tone: "warning",
        },
        rows: [
          {
            label: "Ligne 48 · M. Faure",
            value: "Code postal manquant",
            tag: "À corriger",
          },
          {
            label: "Ligne 112 · SCI Horizon",
            value: "Deux fois dans le fichier",
            tag: "Doublon",
          },
          {
            label: "Lignes valides",
            value: "Prêtes à importer",
            tag: "406",
          },
        ],
      },
    },
    {
      label: "Échéances",
      title: "Les relances repartent à la bonne date",
      text: "Les dates des derniers passages sont reprises. Vos clients reçoivent leur rappel comme avant, sans trou dans la saison.",
      bullets: [
        "Date du dernier ramonage reprise par appareil",
        "Prochaine échéance recalculée",
        "Relance envoyée à votre nom",
      ],
      visual: {
        title: "Échéances reprises",
        subtitle: "Après l’import",
        status: {
          label: "498 appareils",
          tone: "neutral",
        },
        rows: [
          {
            label: "Octobre",
            value: "À revoir ce mois-ci",
            tag: "72",
          },
          {
            label: "Novembre",
            value: "",
            tag: "58",
          },
          {
            label: "Décembre",
            value: "",
            tag: "41",
          },
        ],
      },
    },
    {
      label: "Prix",
      title: "Un prix pour l’entreprise, pas par technicien",
      text: "Le saisonnier, l’apprenti, la secrétaire : chacun a son accès, sans changer d’abonnement.",
      bullets: ["Utilisateurs illimités", "Toutes les fonctions incluses", "Sans engagement"],
      visual: {
        title: "Votre abonnement",
        subtitle: "Ramonage Martin",
        rows: [
          {
            label: "Utilisateurs",
            value: "Illimités",
            tag: "6 actifs",
          },
          {
            label: "Prix",
            value: "[Prix à venir]",
          },
          {
            label: "Engagement",
            value: "Aucun",
          },
        ],
      },
    },
    {
      label: "Comparer",
      title: "Les différences, écrites noir sur blanc",
      text: "Nos comparatifs donnent les prix publics, datés, et ce que fait chaque outil, sans dénigrer personne.",
      bullets: [
        "Prix publics, avec leur date de relevé",
        "Fonctions présentes et absentes, des deux côtés",
        "Mis à jour chaque trimestre",
      ],
      visual: {
        title: "Comparatif",
        subtitle: "Relevé du [date]",
        rows: [
          {
            label: "Utilisateurs",
            value: "Passalio : illimités · Autre outil : [à relever]",
          },
          {
            label: "Hors ligne",
            value: "Passalio : complet · Autre outil : [à relever]",
          },
          {
            label: "Relances",
            value: "Passalio : par mail · Autre outil : [à relever]",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Combien de temps prend le changement ?",
      answer: "Une soirée pour la reprise des clients, avec Antho au téléphone si vous voulez.",
    },
    {
      question: "Je suis encore engagé chez un autre éditeur.",
      answer: "Préparez la reprise avant la fin de votre contrat. Passalio est sans engagement.",
    },
    {
      question: "Et mes anciens certificats ?",
      answer:
        "Gardez-les en PDF. Les nouveaux se font dans Passalio, avec la date du dernier passage reprise.",
    },
  ],
  finalTitle: "Envoyez-nous votre export, on regarde ensemble.",
};
