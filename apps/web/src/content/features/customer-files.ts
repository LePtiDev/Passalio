import type { MarketingPageInput } from "../content-schema";

export const customerFilesPage: MarketingPageInput = {
  slug: "fiches-clients",
  isPublished: true,
  seo: {
    title: "Fiches clients pour ramoneurs | Passalio",
    description:
      "Clients, adresses, appareils, conduits et historique des passages au même endroit. Retrouvez une fiche en tapant trois lettres.",
  },
  menu: {
    title: "Fiches clients",
    text: "Lieux, appareils, historique.",
    icon: "home",
  },
  eyebrow: "Produit · Fiches clients",
  title: "Chaque client, chaque appareil, chaque passage. Au même endroit.",
  lead: "La fiche client garde l’adresse, l’accès, les appareils, les conduits et tout l’historique des passages. Vous la retrouvez en tapant trois lettres.",
  highlights: [
    "Plusieurs adresses et appareils",
    "Historique complet des passages",
    "Recherche instantanée",
  ],
  screen: {
    backLabel: "Clients",
    status: {
      label: "Particulier",
      tone: "neutral",
    },
    title: "Mme Durand",
    subtitle: "06 11 22 33 44 · Le Perreux",
    rows: [
      {
        label: "Poêle à bois",
        value: "Conduit tubé inox Ø 150",
      },
      {
        label: "Cheminée ouverte",
        value: "Conduit maçonné",
      },
      {
        label: "Dernier passage",
        value: "14 oct. 2026 · ramonage",
        tag: "Fait",
      },
      {
        label: "Accès",
        value: "Code 2207 · portail gris",
      },
    ],
    action: "Planifier un passage",
  },
  pains: [
    {
      title: "Le classeur",
      text: "Les fiches cartonnées, dans l’ordre alphabétique, au bureau.",
    },
    {
      title: "Le tableur",
      text: "Une colonne par appareil, jusqu’à ce que ça déborde.",
    },
    {
      title: "La question",
      text: "« Vous étiez venu quand, la dernière fois ? »",
    },
  ],
  featuresTitle: "Ce que vous savez de vos clients, enfin rangé.",
  features: [
    {
      label: "Clients",
      title: "Particuliers, syndics, bailleurs : chacun sa fiche",
      text: "Un client peut avoir plusieurs adresses. Une adresse peut avoir plusieurs appareils. Passalio range tout ça sans tableur.",
      bullets: [
        "Particulier ou professionnel",
        "Plusieurs adresses par client",
        "Contacts et accès par adresse",
      ],
      visual: {
        title: "SCI Les Tilleuls",
        subtitle: "Syndic · 3 adresses",
        status: {
          label: "Professionnel",
          tone: "neutral",
        },
        rows: [
          {
            label: "4 allée des Tilleuls",
            value: "12 conduits",
          },
          {
            label: "9 rue Paul Bert",
            value: "6 conduits",
          },
          {
            label: "2 place de la Mairie",
            value: "2 conduits",
          },
        ],
      },
    },
    {
      label: "Appareils et conduits",
      title: "L’appareil décrit une fois, repris à chaque passage",
      text: "Type, combustible, marque, puissance, conduit. Vous ne le ressaisissez plus, il apparaît sur le document.",
      bullets: [
        "Poêle, insert, chaudière, cheminée",
        "Conduit et diamètre",
        "Photos de l’installation",
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
            label: "Puissance",
            value: "8 kW",
          },
          {
            label: "Conduit",
            value: "Inox Ø 80, 6 m",
          },
        ],
      },
    },
    {
      label: "Historique",
      title: "Tous les passages, dans l’ordre",
      text: "Chaque passage reste attaché au client et à l’appareil. Vous retrouvez une date en deux secondes, même deux ans après.",
      bullets: [
        "Date, technicien, type de passage",
        "Observations et photos",
        "Recherche par nom, adresse ou téléphone",
      ],
      visual: {
        title: "Historique",
        subtitle: "Mme Durand · poêle à bois",
        status: {
          label: "3 passages",
          tone: "validated",
        },
        rows: [
          {
            label: "14 oct. 2026",
            value: "Ramonage · Julien",
            tag: "Fait",
          },
          {
            label: "9 oct. 2025",
            value: "Ramonage · Julien",
            tag: "Fait",
          },
          {
            label: "2 nov. 2024",
            value: "Ramonage · Karim",
            tag: "Fait",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Mes données m’appartiennent-elles ?",
      answer: "Oui. Vous pouvez les exporter à tout moment. Elles sont hébergées en Europe.",
    },
    {
      question: "Combien de clients puis-je avoir ?",
      answer: "Autant que vous voulez.",
    },
  ],
  finalTitle: "Rangez vos clients sur Passalio.",
};
