import type { StoryInput } from "../content-schema";

export const twoDocumentsStory: StoryInput = {
  slug: "un-poele-deux-documents",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "Un poêle, deux documents, une signature | Passalio",
    description:
      "Histoire de terrain : ramonage et entretien du même poêle en une visite. Le client signe une fois et reçoit deux documents clairs.",
  },
  card: {
    moment: "Visite d’octobre",
    quote: "« Lequel je garde pour l’assurance ? »",
    theme: "navy",
    title: "Un poêle, deux documents, une signature",
    summary:
      "Ramonage du conduit et entretien du poêle le même jour. Deux obligations, deux papiers, et un client qui ne sait plus lequel garder.",
    activity: "Poêliers et installateurs",
    minutes: 3,
  },
  featureSlugs: ["attestation-entretien", "certificat-de-ramonage"],
  title: "Ramonage et entretien du même poêle : une visite, une signature, deux documents.",
  lead: "Depuis 2023, l’entretien d’un poêle à bois ou à granulés a son propre document. Thomas fait les deux le même jour. Ses clients s’y perdaient.",
  character: {
    initial: "T",
    name: "Thomas",
    role: "Installateur de poêles, Vincennes",
  },
  sections: [
    {
      heading: "Une question qui revient",
      paragraphs: [
        "Thomas ramone le conduit, puis il entretient le poêle : foyer, joints, évacuation. Il remplit le carnet de ramonage, puis une feuille d’entretien. Le client signe deux fois.",
        "Un an plus tard, le client rappelle. Son assureur lui demande « l’attestation ». Il a deux papiers, il ne sait pas lequel envoyer.",
      ],
      quote: {
        text: "Lequel je garde pour l’assurance ?",
        author: "Un client de Thomas",
      },
    },
    {
      heading: "Avec Passalio : un passage, deux documents",
      paragraphs: [
        "Thomas ouvre le passage depuis son planning. Il coche le ramonage, puis les points d’entretien de l’appareil. Il note ses conseils d’usage, comme le demande l’arrêté.",
        "Le client signe une seule fois sur l’écran. Il reçoit un mail avec deux PDF, chacun avec son titre clair : certificat de ramonage, attestation d’entretien.",
      ],
      quote: {
        text: "Le client signe une fois, et il sait ce qu’il a.",
        author: "Thomas",
      },
    },
    {
      heading: "Rangés au bon endroit",
      paragraphs: [
        "Les deux documents sont rangés sur l’appareil, dans la fiche du client. Si l’assureur appelle, Thomas sait lequel renvoyer.",
      ],
    },
  ],
  before: [
    "Un carnet et une feuille volante",
    "Deux signatures du client",
    "Des clients perdus entre deux papiers",
  ],
  after: [
    "Ramonage et entretien dans le même passage",
    "Une seule signature",
    "Deux PDF clairs dans le même mail",
  ],
  visual: {
    title: "Visite du 14 octobre",
    subtitle: "M. Laurent · Vincennes",
    status: {
      label: "2 documents",
      tone: "neutral",
    },
    rows: [
      {
        label: "Certificat de ramonage",
        value: "Conduit inox Ø 80",
        tag: "Signé",
      },
      {
        label: "Attestation d’entretien",
        value: "Poêle à granulés 8 kW",
        tag: "Signé",
      },
      {
        label: "Envoi",
        value: "Les deux PDF, un seul mail",
        tag: "Envoyé",
      },
    ],
  },
  callToAction: "Faites les deux documents en une visite.",
  relatedSlugs: [
    "plaque-derriere-le-poele",
    "certificat-demande-par-assureur",
    "ramonage-entre-deux-chaudieres",
  ],
};
