import type { StoryInput } from "../content-schema";

export const insurerRequestStory: StoryInput = {
  slug: "certificat-demande-par-assureur",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "Le certificat demandé deux ans après | Passalio",
    description:
      "Histoire de terrain : après un feu de cheminée, l’assureur demande le certificat de ramonage. Retrouvé et renvoyé depuis le téléphone en quelques secondes.",
  },
  card: {
    moment: "Deux ans plus tard",
    quote: "« L’assureur veut le certificat. »",
    theme: "mint",
    title: "Le certificat demandé deux ans après",
    summary:
      "Un feu de cheminée chez une cliente. L’assureur demande la preuve du dernier ramonage. Le carnet, lui, est au fond du camion.",
    activity: "Ramoneur seul",
    minutes: 3,
  },
  featureSlugs: ["certificat-de-ramonage", "fiches-clients"],
  title:
    "Deux ans après le ramonage, l’assureur demande le certificat. Julien le renvoie depuis le parking.",
  lead: "Un feu de cheminée chez une ancienne cliente. Son assureur veut la preuve du dernier ramonage avant d’ouvrir le dossier. Avec un carnet, c’est une soirée de recherche. Avec Passalio, c’est une recherche par nom.",
  character: {
    initial: "J",
    name: "Julien",
    role: "Ramoneur à son compte, Nogent-sur-Marne",
  },
  sections: [
    {
      heading: "Un mardi de janvier, un appel inquiet",
      paragraphs: [
        "Il est 9 h. Julien sort de chez un client quand Mme Faure l’appelle. Un feu de conduit dimanche soir, les pompiers sont venus, personne n’est blessé. Mais l’assureur demande le certificat du dernier ramonage avant d’aller plus loin.",
        "Le dernier passage date de novembre, il y a plus d’un an. Mme Faure a cherché partout. Elle ne retrouve pas son exemplaire.",
      ],
      quote: {
        text: "Vous l’avez bien gardé, vous, le certificat ?",
        author: "Mme Faure, au téléphone",
      },
    },
    {
      heading: "Le carnet, au fond du camion",
      paragraphs: [
        "Avant, Julien remplissait un carnet à souche. L’original pour le client, le double carbone pour lui. Les carnets pleins finissaient dans un carton, dans le camion puis au garage.",
        "Retrouver un double d’il y a un an, c’est fouiller trois carnets le soir, espérer que le carbone soit lisible, le scanner, l’envoyer. Pendant ce temps, la cliente attend et le dossier de l’assureur aussi.",
      ],
    },
    {
      heading: "Avec Passalio : taper « Faure »",
      paragraphs: [
        "Julien s’arrête sur le parking. Il tape « Faure » dans la recherche. La fiche s’ouvre avec le poêle, le conduit, et l’historique des passages. Le certificat de novembre est là, signé, en PDF.",
        "Il appuie sur « Renvoyer ». Mme Faure le reçoit par mail pendant qu’elle est encore au téléphone. Le certificat n’a pas bougé depuis la signature : c’est exactement le document qu’elle avait reçu ce jour-là.",
      ],
      quote: {
        text: "Je l’ai renvoyé avant qu’elle raccroche.",
        author: "Julien",
      },
    },
    {
      heading: "Ce qui compte, ce jour-là",
      paragraphs: [
        "Le certificat contient toutes les mentions demandées : l’entreprise, l’appareil, le conduit, ce qui a été fait, la date. Personne ne peut dire qu’il manque une case.",
        "Pour Julien, c’est surtout une cliente rassurée, qui le rappellera l’an prochain.",
      ],
    },
  ],
  before: [
    "Un carnet à souche par saison",
    "Les doubles dans un carton au garage",
    "Une soirée pour retrouver un document",
  ],
  after: [
    "Chaque certificat rangé dans la fiche du client",
    "Retrouvé en tapant le nom",
    "Renvoyé par mail depuis le téléphone",
  ],
  visual: {
    title: "Mme Faure",
    subtitle: "Poêle à bois · conduit maçonné",
    status: {
      label: "3 certificats",
      tone: "validated",
    },
    rows: [
      {
        label: "Certificat n° 2025-0087",
        value: "Signé le 18 novembre 2025",
        tag: "Signé",
      },
      {
        label: "Renvoyé",
        value: "Le 13 janvier à 9 h 06",
        tag: "Envoyé",
      },
      {
        label: "Certificat n° 2024-0061",
        value: "Signé le 4 novembre 2024",
        tag: "Signé",
      },
    ],
  },
  callToAction: "Gardez chaque certificat, sans carton.",
  relatedSlugs: ["sans-reseau", "un-poele-deux-documents", "reprise-de-clientele"],
};
