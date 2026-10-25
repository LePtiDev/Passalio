import type { MarketingPageInput } from "../content-schema";

export const offlinePage: MarketingPageInput = {
  slug: "hors-ligne",
  isPublished: true,
  seo: {
    title: "Logiciel de ramonage hors ligne | Passalio",
    description:
      "Fiches clients, codes d’accès et planning restent dans le téléphone. Vous travaillez sans réseau, et tout part dès qu’il revient.",
  },
  menu: {
    title: "Hors ligne",
    text: "Tout s’ouvre, même sans réseau.",
    icon: "offline",
  },
  eyebrow: "Produit · Hors ligne",
  title: "Cave, sous-sol, campagne. Passalio marche quand même.",
  lead: "Vos passages du jour, vos fiches clients et vos documents restent dans le téléphone. Vous travaillez sans réseau, Passalio envoie tout dès qu’il revient.",
  highlights: [
    "Fiches du jour dans le téléphone",
    "Ce qui reste à envoyer, visible",
    "Envoi automatique au retour du réseau",
  ],
  screen: {
    backLabel: "Ma journée",
    status: {
      label: "Hors ligne",
      tone: "warning",
    },
    title: "Mme Durand",
    subtitle: "8 rue Jean Jaurès, Le Perreux",
    rows: [
      {
        label: "Accès",
        value: "Code 2207 · portail gris",
      },
      {
        label: "Appareil",
        value: "Poêle à bois · tubé inox",
      },
      {
        label: "Notes",
        value: "Chien dans le jardin",
      },
      {
        label: "À envoyer",
        value: "1 modification",
        tag: "En attente",
      },
    ],
    action: "Continuer le passage",
  },
  pains: [
    {
      title: "La cave",
      text: "Pas une barre au pied de la chaudière.",
    },
    {
      title: "L’écran blanc",
      text: "L’application tourne dans le vide, le client attend.",
    },
    {
      title: "Le doute",
      text: "Est-ce que ce que j’ai rempli est bien enregistré ?",
    },
  ],
  featuresTitle: "Le réseau ne décide plus de votre journée.",
  features: [
    {
      label: "Préparé à l’avance",
      title: "Votre journée est déjà dans le téléphone",
      text: "Quand vous ouvrez Passalio avec du réseau, les passages et les fiches dont vous avez besoin sont gardés sur l’appareil.",
      bullets: [
        "Passages du jour et du lendemain",
        "Fiches clients et appareils",
        "Accès, digicode et notes",
      ],
      visual: {
        title: "Gardé dans le téléphone",
        subtitle: "Mis à jour à 7 h 52",
        status: {
          label: "Prêt",
          tone: "validated",
        },
        rows: [
          {
            label: "Passages",
            value: "5 aujourd’hui, 4 demain",
          },
          {
            label: "Fiches clients",
            value: "9 fiches",
          },
          {
            label: "Notes et accès",
            value: "Tous disponibles",
          },
        ],
      },
    },
    {
      label: "Sans réseau",
      title: "Vous remplissez, Passalio garde",
      text: "Vous modifiez une fiche ou notez une observation sans réseau. C’est enregistré tout de suite dans le téléphone.",
      bullets: [
        "Aucune saisie perdue",
        "Même écran avec ou sans réseau",
        "Bandeau clair quand vous êtes hors ligne",
      ],
      visual: {
        title: "Hors ligne depuis 11 h 20",
        subtitle: "Vous pouvez continuer",
        status: {
          label: "Hors ligne",
          tone: "warning",
        },
        rows: [
          {
            label: "Fiche Mme Durand",
            value: "Modifiée à 11 h 24",
            tag: "Gardé",
          },
          {
            label: "Note d’accès",
            value: "Ajoutée à 11 h 26",
            tag: "Gardé",
          },
        ],
      },
    },
    {
      label: "Au retour du réseau",
      title: "Tout part tout seul, et vous le voyez",
      text: "Dès que le réseau revient, Passalio envoie ce qui attendait. Vous savez toujours ce qui reste à envoyer.",
      bullets: [
        "Compteur de ce qui reste à envoyer",
        "Envoi automatique, sans bouton",
        "Message clair si un envoi échoue",
      ],
      visual: {
        title: "Synchronisation",
        subtitle: "Réseau revenu à 11 h 41",
        status: {
          label: "À jour",
          tone: "validated",
        },
        rows: [
          {
            label: "Fiche Mme Durand",
            value: "Envoyée à 11 h 41",
            tag: "Envoyé",
          },
          {
            label: "Note d’accès",
            value: "Envoyée à 11 h 41",
            tag: "Envoyé",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Faut-il installer une application ?",
      answer:
        "Non. Passalio s’ouvre dans le navigateur et s’ajoute à l’écran d’accueil du téléphone.",
    },
    {
      question: "Que se passe-t-il si deux personnes modifient la même fiche ?",
      answer:
        "Chaque changement est envoyé seul. Si deux personnes modifient des informations différentes, les deux sont gardées. Sur la même information, la dernière envoyée l’emporte.",
    },
  ],
  finalTitle: "Faites votre prochaine tournée sur Passalio, réseau ou pas.",
};
