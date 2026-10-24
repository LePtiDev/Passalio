import type { MarketingPageInput } from "../content-schema";

export const plateReadingPage: MarketingPageInput = {
  slug: "lecture-de-plaque",
  isPublished: false,
  seo: {
    title: "Lecture de plaque signalétique | Passalio",
    description:
      "Photographiez la plaque signalétique du poêle : marque, modèle, puissance et combustible proposés, vérifiés par vous avant d’enregistrer.",
  },
  menu: {
    title: "Lecture de plaque",
    text: "La photo remplit la fiche.",
    icon: "camera",
  },
  eyebrow: "Produit · Lecture de plaque",
  title: "Une photo de la plaque, et l’appareil est décrit.",
  lead: "Vous photographiez la plaque signalétique. Passalio lit la marque, le modèle, la puissance et le combustible, et remplit la fiche. Vous vérifiez avant d’enregistrer.",
  highlights: [
    "Marque, modèle, puissance",
    "Vous validez chaque champ",
    "Plus de plaque recopiée à genoux",
  ],
  screen: {
    backLabel: "M. Laurent",
    status: {
      label: "Lu sur la photo",
      tone: "validated",
    },
    title: "Nouvel appareil",
    subtitle: "Photo de la plaque · 1 image",
    rows: [
      {
        label: "Marque",
        value: "MCZ",
        tag: "Lu",
      },
      {
        label: "Modèle",
        value: "Ego 8",
        tag: "Lu",
      },
      {
        label: "Puissance",
        value: "8 kW",
        tag: "Lu",
      },
      {
        label: "Combustible",
        value: "Granulés",
        tag: "Lu",
      },
    ],
    action: "Vérifier et enregistrer",
  },
  pains: [
    {
      title: "À genoux",
      text: "La plaque est derrière le poêle, à moitié effacée.",
    },
    {
      title: "Le carnet",
      text: "Recopier un numéro de série de quinze caractères.",
    },
    {
      title: "L’erreur",
      text: "Une puissance mal recopiée, et le document est faux.",
    },
  ],
  featuresTitle: "Moins de saisie, sans perdre le contrôle.",
  features: [
    {
      label: "Photo",
      title: "Vous photographiez, Passalio lit",
      text: "Une ou plusieurs photos de la plaque. Passalio en extrait les informations utiles à la fiche de l’appareil.",
      bullets: [
        "Marque, modèle, numéro de série",
        "Puissance et combustible",
        "Plusieurs photos si la plaque est abîmée",
      ],
      visual: {
        title: "Lecture de la plaque",
        subtitle: "2 photos",
        status: {
          label: "Lu",
          tone: "validated",
        },
        rows: [
          {
            label: "Numéro de série",
            value: "EG8-2019-04417",
            tag: "Lu",
          },
          {
            label: "Puissance",
            value: "8 kW",
            tag: "Lu",
          },
          {
            label: "Année",
            value: "Illisible",
            tag: "À saisir",
          },
        ],
      },
    },
    {
      label: "Vérification",
      title: "Rien n’est enregistré sans votre accord",
      text: "Chaque champ lu est proposé, pas imposé. Vous corrigez ce qui est faux, vous complétez ce qui manque.",
      bullets: [
        "Champs lus signalés comme tels",
        "Correction en un geste",
        "Ce qui n’a pas été lu reste vide",
      ],
      visual: {
        title: "À vérifier",
        subtitle: "Avant d’enregistrer",
        status: {
          label: "1 champ à compléter",
          tone: "warning",
        },
        rows: [
          {
            label: "Marque",
            value: "MCZ",
            tag: "Vérifié",
          },
          {
            label: "Modèle",
            value: "Ego 8",
            tag: "Vérifié",
          },
          {
            label: "Année",
            value: "À saisir",
            tag: "Manque",
          },
        ],
      },
    },
    {
      label: "Sur la fiche",
      title: "La photo reste sur la fiche de l’appareil",
      text: "La photo de la plaque est gardée avec l’appareil. Au prochain passage, elle est là si un doute revient.",
      bullets: [
        "Photo jointe à l’appareil",
        "Reprise sur les documents",
        "Visible par toute l’équipe",
      ],
      visual: {
        title: "Poêle à granulés",
        subtitle: "M. Laurent · salon",
        rows: [
          {
            label: "Marque et modèle",
            value: "MCZ Ego 8",
          },
          {
            label: "Photo de la plaque",
            value: "Ajoutée le 14 oct. 2026",
          },
          {
            label: "Source",
            value: "Lu sur la photo, vérifié par Julien",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Ça marche sans réseau ?",
      answer:
        "Non : la lecture demande du réseau. Sans réseau, vous gardez la photo et la lisez plus tard, ou vous saisissez à la main.",
    },
    {
      question: "Et si la plaque est illisible ?",
      answer: "Passalio laisse vide ce qu’il n’a pas pu lire. Vous complétez à la main.",
    },
    {
      question: "Mes photos servent-elles à autre chose ?",
      answer: "[Réponse à reprendre de la note sur la lecture de plaque]",
    },
  ],
  finalTitle: "Décrivez votre prochain appareil sur Passalio.",
};
