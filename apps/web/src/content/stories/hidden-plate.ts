import type { StoryInput } from "../content-schema";

export const hiddenPlateStory: StoryInput = {
  slug: "plaque-derriere-le-poele",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "La plaque est derrière le poêle | Passalio",
    description:
      "Histoire de terrain : une poêlière photographie la plaque signalétique au lieu de la recopier à genoux, puis vérifie chaque champ avant d’enregistrer.",
  },
  card: {
    moment: "Premier passage",
    quote: "« La plaque est derrière le poêle. »",
    theme: "mint",
    title: "La plaque est derrière le poêle",
    summary:
      "Un nouveau client, un poêle de 2014, une plaque à moitié effacée. Léa la photographie au lieu de la recopier à genoux.",
    activity: "Poêliers et installateurs",
    minutes: 3,
  },
  featureSlugs: ["lecture-de-plaque", "fiches-clients"],
  title:
    "La plaque est derrière le poêle, à moitié effacée. Léa la photographie au lieu de la recopier.",
  lead: "Premier passage chez un nouveau client : il faut décrire l’appareil. Marque, modèle, puissance, numéro de série. D’habitude, c’est cinq minutes à genoux avec une lampe.",
  character: {
    initial: "L",
    name: "Léa",
    role: "Poêlière et installatrice, Saint-Maur-des-Fossés",
  },
  sections: [
    {
      heading: "Un poêle de 2014, une plaque illisible",
      paragraphs: [
        "M. Garnier vient d’acheter la maison. Le poêle à granulés était déjà là. Personne ne sait quel modèle c’est. La plaque signalétique est à l’arrière, entre le poêle et le mur.",
        "Léa se met à genoux, la lampe dans la bouche. Le numéro de série fait quinze caractères. Deux sont effacés.",
      ],
      quote: {
        text: "Un 8 ou un B ? Je ne sais jamais.",
        author: "Léa",
      },
    },
    {
      heading: "Avant : recopier, puis ressaisir",
      paragraphs: [
        "Elle notait la plaque sur un bout de papier, puis la recopiait le soir dans son tableur. Une erreur de puissance, et le document du client est faux.",
      ],
    },
    {
      heading: "Avec Passalio : une photo",
      paragraphs: [
        "Léa photographie la plaque avec son téléphone. Passalio lit la marque, le modèle, la puissance, le combustible et le numéro de série. Il laisse vide l’année, qu’il n’a pas pu lire.",
        "Léa vérifie chaque champ, complète l’année avec M. Garnier, et enregistre. La photo reste sur la fiche de l’appareil, pour le prochain passage.",
      ],
      quote: {
        text: "Je vérifie, je ne recopie plus.",
        author: "Léa",
      },
    },
  ],
  before: [
    "La plaque recopiée à genoux",
    "Ressaisie le soir dans un tableur",
    "Des erreurs de puissance ou de série",
  ],
  after: [
    "Une photo de la plaque",
    "Chaque champ lu, vérifié par Léa",
    "La photo gardée sur la fiche",
  ],
  visual: {
    title: "Lecture de la plaque",
    subtitle: "Poêle à granulés · M. Garnier",
    status: {
      label: "1 champ à compléter",
      tone: "warning",
    },
    rows: [
      {
        label: "Marque et modèle",
        value: "Lus sur la photo",
        tag: "Vérifié",
      },
      {
        label: "Puissance",
        value: "9 kW",
        tag: "Vérifié",
      },
      {
        label: "Année",
        value: "Illisible",
        tag: "À saisir",
      },
    ],
  },
  callToAction: "Décrivez l’appareil en une photo.",
  relatedSlugs: ["un-poele-deux-documents", "sans-reseau", "trois-techniciens-un-planning"],
};
