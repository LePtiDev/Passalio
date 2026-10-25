import type { StoryInput } from "../content-schema";

export const sharedPlanningStory: StoryInput = {
  slug: "trois-techniciens-un-planning",
  isPublished: true,
  publishedOn: "2026-10-24",
  seo: {
    title: "Trois techniciens, un seul planning | Passalio",
    description:
      "Histoire de terrain : le secrétariat d’une entreprise de ramonage organise trois techniciens sur un planning partagé, sans passer ses matinées au téléphone.",
  },
  card: {
    moment: "Lundi, 7 h 45",
    quote: "« Qui passe chez Mme Petit ? »",
    theme: "amber",
    title: "Trois techniciens, un seul planning",
    summary:
      "Sophie tient le planning, trois techniciens sont sur la route. Fini les appels pour savoir qui passe où.",
    activity: "Entreprise de ramonage",
    minutes: 4,
  },
  featureSlugs: ["planning-tournees", "equipe-et-roles"],
  title:
    "Trois techniciens sur la route, un seul planning. Sophie ne passe plus ses matinées au téléphone.",
  lead: "Chez Ramonage Martin, Sophie prend les rendez-vous, Julien, Karim et Léa les font. Entre le bureau et les camions, tout passait par le téléphone.",
  character: {
    initial: "S",
    name: "Sophie",
    role: "Secrétariat, entreprise de 4 personnes, Fontenay-sous-Bois",
  },
  sections: [
    {
      heading: "Lundi, 7 h 45",
      paragraphs: [
        "Sophie a imprimé les tournées de la semaine vendredi soir. Depuis, deux clients ont annulé et un troisième a demandé à avancer. Elle appelle Karim, qui est déjà en route. Puis Léa, qui ne répond pas.",
        "À 10 h, Mme Petit appelle : « Qui passe chez moi, et à quelle heure ? » Sophie n’est plus sûre.",
      ],
      quote: {
        text: "Je passais mes matinées à appeler les gars pour savoir où ils en étaient.",
        author: "Sophie",
      },
    },
    {
      heading: "Avec Passalio : un planning que tout le monde voit",
      paragraphs: [
        "Sophie ouvre la vue équipe : une colonne par technicien, les passages de la journée dedans. Elle déplace le rendez-vous de Mme Petit chez Léa, qui est dans le quartier.",
        "Léa le voit tout de suite sur son téléphone, avec l’adresse, le code d’accès et l’appareil. Pas besoin d’appel.",
      ],
    },
    {
      heading: "Chacun voit ce qu’il doit voir",
      paragraphs: [
        "Les techniciens voient leurs passages et leurs clients. Sophie voit tout le planning. Quand un technicien quitte l’entreprise, son accès est coupé, ses passages restent.",
        "Et ajouter un saisonnier pour l’automne ne coûte pas un compte de plus.",
      ],
      quote: {
        text: "Quand Mme Petit appelle, je réponds en regardant l’écran.",
        author: "Sophie",
      },
    },
  ],
  before: [
    "Les tournées imprimées le vendredi",
    "Les changements passés par téléphone",
    "Des clients qui ne savaient pas qui viendrait",
  ],
  after: [
    "Une vue équipe partagée",
    "Un passage confié en un geste",
    "Chaque technicien voit sa journée à jour",
  ],
  visual: {
    title: "Lundi 12 octobre",
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
        value: "4 passages · Fontenay, dont Mme Petit",
        tag: "Modifié",
      },
    ],
  },
  callToAction: "Mettez toute l’équipe sur le même planning.",
  relatedSlugs: ["appels-manques-en-septembre", "sans-reseau", "plaque-derriere-le-poele"],
};
