import type { StoryInput } from "../content-schema";

export const customerTakeoverStory: StoryInput = {
  slug: "reprise-de-clientele",
  isPublished: false,
  publishedOn: "2026-10-24",
  seo: {
    title: "Trois cents clients dans un classeur | Passalio",
    description:
      "Histoire de terrain : un ramoneur reprend la clientèle d’un confrère parti à la retraite, sans perdre une fiche ni une échéance.",
  },
  card: {
    moment: "Reprise de clientèle",
    quote: "« Tout est dans le classeur. »",
    theme: "navy",
    title: "Trois cents clients dans un classeur",
    summary:
      "Nicolas reprend la clientèle d’un ramoneur qui part à la retraite. Trois cents fiches cartonnées et un carnet d’adresses.",
    activity: "Changer de logiciel",
    minutes: 4,
  },
  featureSlugs: ["fiches-clients", "relances"],
  title:
    "Nicolas reprend la clientèle d’un ramoneur qui part à la retraite. Trois cents fiches tiennent dans un classeur.",
  lead: "M. Roux a ramoné le même secteur pendant trente ans. Il part, et confie ses clients à Nicolas. Ce qu’il lui donne : un classeur, et sa mémoire.",
  character: {
    initial: "N",
    name: "Nicolas",
    role: "Ramoneur, reprend une clientèle à Champigny-sur-Marne",
  },
  sections: [
    {
      heading: "Le jour de la passation",
      paragraphs: [
        "M. Roux pose le classeur sur la table. Une fiche cartonnée par client, rangée par commune. L’adresse, le téléphone, l’appareil, et une colonne de dates au crayon.",
        "Certaines fiches ont un mot : « chien méchant », « passer par le garage », « veuve, appeler son fils ».",
      ],
      quote: {
        text: "Tout est dans le classeur. Le reste, c’est dans ma tête.",
        author: "M. Roux",
      },
    },
    {
      heading: "Ne rien perdre",
      paragraphs: [
        "Pour Nicolas, chaque fiche est un client à garder. Une adresse mal recopiée, et le client part ailleurs. Une note perdue, et c’est la mauvaise surprise sur place.",
      ],
    },
    {
      heading: "Avec Passalio : les fiches reprises",
      paragraphs: [
        "Nicolas fait saisir les fiches dans un tableur, puis les importe dans Passalio. Chaque client a sa fiche, avec son adresse, son appareil, la date du dernier ramonage et la note de M. Roux.",
        "Passalio calcule les échéances. Nicolas voit, mois par mois, qui il doit prévenir. Le premier automne, il envoie un mot à chaque client pour se présenter.",
      ],
      quote: {
        text: "Les clients de M. Roux ont eu de mes nouvelles avant d’avoir à me chercher.",
        author: "Nicolas",
      },
    },
  ],
  before: [
    "Un classeur de fiches cartonnées",
    "Des notes au crayon",
    "Des échéances à recalculer à la main",
  ],
  after: [
    "Chaque fiche reprise dans Passalio",
    "Les notes gardées sur la fiche",
    "Les échéances calculées",
  ],
  visual: {
    title: "Import des clients",
    subtitle: "Fichier de M. Roux",
    status: {
      label: "À vérifier",
      tone: "warning",
    },
    rows: [
      {
        label: "Clients repris",
        value: "296 fiches",
        tag: "Fait",
      },
      {
        label: "Adresses à vérifier",
        value: "4 fiches",
      },
      {
        label: "Échéances calculées",
        value: "Septembre à décembre",
        tag: "Fait",
      },
    ],
  },
  callToAction: "Reprenez vos clients, sans en perdre un.",
  relatedSlugs: [
    "appels-manques-en-septembre",
    "certificat-demande-par-assureur",
    "ramonage-entre-deux-chaudieres",
  ],
};
