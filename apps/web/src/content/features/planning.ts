import type { MarketingPageInput } from "../content-schema";

export const planningPage: MarketingPageInput = {
  slug: "planning-tournees",
  isPublished: true,
  seo: {
    title: "Planning de ramonage et tournées | Passalio",
    description:
      "Les passages du jour, de la semaine et de toute l’équipe, avec l’adresse, l’accès et l’appareil. Sur téléphone et ordinateur, même sans réseau.",
  },
  menu: {
    title: "Planning et tournées",
    text: "Jour, semaine, toute l’équipe.",
    icon: "calendar",
  },
  eyebrow: "Produit · Planning et tournées",
  title: "Votre semaine de passages, sur un seul écran.",
  lead: "Les rendez-vous de la journée, de la semaine et de toute l’équipe, avec l’adresse, l’appareil et ce qu’il y a à faire. Sur le téléphone comme sur l’ordinateur.",
  highlights: [
    "Jour, semaine, équipe",
    "Ramonage, entretien, dépannage",
    "Ouvert même sans réseau",
  ],
  screen: {
    backLabel: "Planning",
    status: {
      label: "Jeudi 15",
      tone: "neutral",
    },
    title: "Ma journée",
    subtitle: "5 passages · Nogent et Le Perreux",
    rows: [
      {
        label: "8 h 30 · Mme Durand",
        value: "Ramonage · poêle à bois",
        tag: "Fait",
      },
      {
        label: "10 h 00 · M. Laurent",
        value: "Ramonage et entretien",
      },
      {
        label: "11 h 30 · SCI Les Tilleuls",
        value: "3 conduits · cheminée",
      },
      {
        label: "14 h 00 · M. Benali",
        value: "Dépannage · tirage",
      },
    ],
    action: "Ouvrir le prochain passage",
  },
  pains: [
    {
      title: "L’agenda papier",
      text: "Les rendez-vous notés au crayon, raturés, recopiés.",
    },
    {
      title: "Le coup de fil",
      text: "« Je passe à quelle heure chez Mme Durand déjà ? »",
    },
    {
      title: "L’adresse",
      text: "Le digicode et l’étage sont restés dans un SMS.",
    },
  ],
  featuresTitle: "Savoir où aller, chez qui, pour faire quoi.",
  features: [
    {
      label: "Jour et semaine",
      title: "Votre journée dans l’ordre, la semaine d’un coup d’œil",
      text: "Chaque passage montre l’heure, le client, l’adresse et l’appareil. Vous l’ouvrez, tout est là.",
      bullets: [
        "Vue jour pour la tournée",
        "Vue semaine pour organiser",
        "Type de passage visible en couleur",
      ],
      visual: {
        title: "Semaine du 12 octobre",
        subtitle: "23 passages",
        rows: [
          {
            label: "Lundi",
            value: "5 passages · Nogent",
          },
          {
            label: "Mardi",
            value: "4 passages · Fontenay",
          },
          {
            label: "Mercredi",
            value: "6 passages · Vincennes",
          },
        ],
      },
    },
    {
      label: "Équipe",
      title: "Toute l’équipe sur le même planning",
      text: "Le secrétariat voit qui passe où. Chaque technicien voit sa journée, rien de plus.",
      bullets: [
        "Une colonne par technicien",
        "Passage confié à un technicien en un geste",
        "Chacun voit ses propres rendez-vous",
      ],
      visual: {
        title: "Jeudi 15 octobre",
        subtitle: "Vue équipe",
        status: {
          label: "3 techniciens",
          tone: "neutral",
        },
        rows: [
          {
            label: "Julien",
            value: "5 passages · Nogent",
          },
          {
            label: "Karim",
            value: "4 passages · Saint-Maur",
          },
          {
            label: "Léa",
            value: "3 passages · Créteil",
          },
        ],
      },
    },
    {
      label: "Sur place",
      title: "Le passage ouvre la fiche, la fiche ouvre le document",
      text: "Depuis le planning, vous ouvrez le client, son appareil, l’historique de ses passages, puis le document à remplir.",
      bullets: [
        "Adresse, accès et téléphone du client",
        "Appareil et conduit déjà décrits",
        "Notes du passage précédent",
      ],
      visual: {
        title: "10 h 00 · M. Laurent",
        subtitle: "12 rue des Lilas, Nogent-sur-Marne",
        status: {
          label: "À faire",
          tone: "warning",
        },
        rows: [
          {
            label: "Accès",
            value: "Code 4512B · 2e étage",
          },
          {
            label: "Appareil",
            value: "Poêle à granulés 8 kW",
          },
          {
            label: "Dernier passage",
            value: "Octobre 2025 · RAS",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Mes clients prennent-ils rendez-vous en ligne ?",
      answer: "Pas encore. Vous créez les passages dans Passalio, au bureau ou sur le téléphone.",
    },
    {
      question: "Et si je n’ai pas de réseau ?",
      answer:
        "La journée est gardée dans le téléphone. Vous la consultez et la remplissez sans réseau.",
    },
  ],
  finalTitle: "Organisez votre prochaine semaine sur Passalio.",
};
