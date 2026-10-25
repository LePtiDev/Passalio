import type { StoryInput } from "../content-schema";

export const missedCallsStory: StoryInput = {
  slug: "appels-manques-en-septembre",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "Septembre et ses 14 appels manqués | Passalio",
    description:
      "Histoire de terrain : une entreprise de ramonage prévient ses clients en août, et la rentrée se remplit sans passer les pauses au téléphone.",
  },
  card: {
    moment: "Début septembre",
    quote: "« 14 appels manqués. »",
    theme: "amber",
    title: "Septembre : tout le monde appelle en même temps",
    summary:
      "La saison commence, le téléphone sonne entre deux conduits. Et si les clients avaient été prévenus en août ?",
    activity: "Entreprise de ramonage",
    minutes: 4,
  },
  featureSlugs: ["relances", "planning-tournees"],
  title:
    "En septembre, le téléphone sonne entre deux conduits. Cette année, les clients ont été prévenus en août.",
  lead: "Chaque rentrée, Karim et ses deux techniciens passent leurs pauses à rappeler. Cette année, les rendez-vous ont été pris avant le premier froid.",
  character: {
    initial: "K",
    name: "Karim",
    role: "Gérant d’une entreprise de 3 personnes, Créteil",
  },
  sections: [
    {
      heading: "Le premier lundi de septembre",
      paragraphs: [
        "Il fait encore 25 degrés, et pourtant le téléphone ne s’arrête pas. Tous les clients pensent au ramonage en même temps. Karim est sur un toit à Maisons-Alfort. Quand il redescend, il a 14 appels manqués.",
        "Le soir, il rappelle. Il note les rendez-vous sur un cahier, puis il essaie de les répartir entre lui et ses deux techniciens. Certains clients ont déjà appelé quelqu’un d’autre.",
      ],
      quote: {
        text: "En septembre, je passe plus de temps au téléphone que sur les toits.",
        author: "Karim",
      },
    },
    {
      heading: "Les échéances étaient déjà connues",
      paragraphs: [
        "Le problème, c’est que Karim savait. Les clients ramonés en septembre dernier doivent l’être en septembre cette année. L’information était là, dans les carnets. Personne n’avait le temps de la ressortir.",
      ],
    },
    {
      heading: "Avec Passalio : la saison préparée en août",
      paragraphs: [
        "Chaque certificat signé note la date du prochain passage. Mi-août, Karim ouvre la liste des clients qui arrivent à échéance en septembre. Il y en a 38.",
        "Il envoie les relances en une fois, à son nom. Les clients qui répondent sont planifiés dans les creux de la semaine. Ceux qui n’ont pas d’email restent dans une liste, à appeler quand il a un moment.",
      ],
      quote: {
        text: "Le téléphone sonne toujours. Mais c’est pour confirmer.",
        author: "Karim",
      },
    },
    {
      heading: "Une semaine plus calme",
      paragraphs: [
        "Les tournées sont faites par quartier, plus à la demande. Les techniciens savent où ils vont la veille. Et les clients qui appellent en septembre trouvent encore de la place.",
      ],
    },
  ],
  before: [
    "Les appels de la rentrée rappelés le soir",
    "Des rendez-vous notés sur un cahier",
    "Des clients partis chez un concurrent",
  ],
  after: [
    "La liste des échéances, mois par mois",
    "Des relances envoyées en août",
    "Des tournées organisées par quartier",
  ],
  visual: {
    title: "À relancer en septembre",
    subtitle: "38 clients",
    status: {
      label: "12 à appeler",
      tone: "warning",
    },
    rows: [
      {
        label: "Rendez-vous pris",
        value: "19 clients",
        tag: "Fait",
      },
      {
        label: "Sans réponse",
        value: "7 clients",
      },
      {
        label: "Sans email",
        value: "12 clients · à appeler",
      },
    ],
  },
  callToAction: "Préparez votre saison avant qu’elle commence.",
  relatedSlugs: [
    "trois-techniciens-un-planning",
    "certificat-demande-par-assureur",
    "ramonage-entre-deux-chaudieres",
  ],
};
