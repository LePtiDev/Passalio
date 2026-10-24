import type { StoryInput } from "../content-schema";

export const betweenBoilersStory: StoryInput = {
  slug: "ramonage-entre-deux-chaudieres",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "Le ramonage entre deux chaudières | Passalio",
    description:
      "Histoire de terrain : un chauffagiste ajoute le ramonage à son activité sans changer de logiciel, avec un certificat propre signé sur place.",
  },
  card: {
    moment: "Entre deux dépannages",
    quote: "« Le ramonage, c’est dix minutes. Le papier, vingt. »",
    theme: "mint",
    title: "Le ramonage entre deux chaudières",
    summary:
      "Marc fait surtout du chauffage. Le ramonage est un plus pour ses clients, pas une raison de prendre un logiciel lourd.",
    activity: "Chauffagistes et plombiers",
    minutes: 3,
  },
  featureSlugs: ["certificat-de-ramonage", "fiches-clients"],
  title: "Pour Marc, le ramonage tient en dix minutes sur place. Le papier n’en prend plus vingt.",
  lead: "Marc est chauffagiste et plombier. Il ramone les conduits de ses clients quand il entretient leur chaudière. Son logiciel de devis et factures ne sait pas faire un certificat.",
  character: {
    initial: "M",
    name: "Marc",
    role: "Chauffagiste et plombier, Fontenay-sous-Bois",
  },
  sections: [
    {
      heading: "Un service rendu, un papier de plus",
      paragraphs: [
        "Les clients de Marc lui demandent de ramoner « tant qu’il est là ». Il le fait volontiers. Mais il n’a pas de carnet à souche, alors il tape un modèle Word le soir et l’envoie par mail.",
        "Pour lui, le ramonage est un service rendu. Le papier, lui, prend plus de temps que le conduit.",
      ],
      quote: {
        text: "Le ramonage, c’est dix minutes. Le papier, vingt.",
        author: "Marc",
      },
    },
    {
      heading: "Avec Passalio : juste ce qu’il faut",
      paragraphs: [
        "Marc n’a pas changé de logiciel de facturation. Il utilise Passalio pour le ramonage seulement. La fiche du client, l’appareil, le conduit, et le certificat signé sur place.",
        "Il ne remplit que ce que le certificat demande. Le reste, il continue à le faire comme avant.",
      ],
      quote: {
        text: "Je n’ai pas eu à tout changer pour faire un certificat propre.",
        author: "Marc",
      },
    },
    {
      heading: "Et l’année suivante",
      paragraphs: [
        "Chaque client ramoné a sa date de prochain passage. Marc la voit quand il prépare ses entretiens de chaudière, et propose de tout faire le même jour.",
      ],
    },
  ],
  before: [
    "Un modèle Word rempli le soir",
    "Des certificats sans mentions vérifiées",
    "Rien pour se souvenir de l’année suivante",
  ],
  after: [
    "Le certificat signé sur place",
    "Les mentions vérifiées avant signature",
    "La date du prochain passage notée",
  ],
  visual: {
    title: "M. Benali",
    subtitle: "Chaudière fioul · conduit maçonné",
    status: {
      label: "À faire",
      tone: "warning",
    },
    rows: [
      {
        label: "Entretien chaudière",
        value: "Dans votre logiciel habituel",
      },
      {
        label: "Ramonage du conduit",
        value: "Certificat Passalio",
        tag: "Signé",
      },
      {
        label: "Prochain passage",
        value: "Octobre 2027",
      },
    ],
  },
  callToAction: "Ajoutez le ramonage sans changer de logiciel.",
  relatedSlugs: [
    "certificat-demande-par-assureur",
    "un-poele-deux-documents",
    "reprise-de-clientele",
  ],
};
