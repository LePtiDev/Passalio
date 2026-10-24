import type { MarketingPageInput } from "../content-schema";

export const independentSweepPage: MarketingPageInput = {
  slug: "ramoneur-independant",
  isPublished: true,
  seo: {
    title: "Logiciel pour ramoneur indépendant | Passalio",
    description:
      "Le certificat de ramonage rempli et signé chez le client, sur votre téléphone, même sans réseau. Plus rien à faire le soir. Essai gratuit.",
  },
  menu: {
    title: "Ramoneur seul",
    text: "Plus rien à faire le soir.",
    icon: "user",
  },
  eyebrow: "Pour les ramoneurs qui travaillent seuls",
  title: "Le certificat signé chez le client. Plus rien à faire le soir.",
  lead: "Vous remplissez le certificat sur votre téléphone, le client signe sur l’écran et le reçoit par mail. Onze mois plus tard, Passalio lui rappelle de vous rappeler.",
  highlights: ["Sans engagement", "Fonctionne sans réseau", "iPhone et Android"],
  screen: {
    backLabel: "Mme Durand",
    status: {
      label: "Hors ligne",
      tone: "warning",
    },
    title: "Certificat de ramonage",
    subtitle: "Poêle à bois · conduit tubé inox Ø 150",
    rows: [
      {
        label: "Ramonage mécanique",
        value: "Par le haut",
        tag: "Fait",
      },
      {
        label: "Vacuité vérifiée",
        value: "Sur toute la longueur",
        tag: "Fait",
      },
      {
        label: "Photos",
        value: "2 photos jointes",
      },
      {
        label: "Prochain passage",
        value: "Octobre 2027",
      },
    ],
    action: "Faire signer le client",
  },
  pains: [
    {
      title: "Le soir",
      text: "Une heure à recopier, scanner et envoyer les certificats de la journée.",
    },
    {
      title: "Le carnet",
      text: "La date du dernier ramonage d’un client, introuvable le jour où il la demande.",
    },
    {
      title: "L’année suivante",
      text: "Des clients qui ne rappellent pas. Pas partis ailleurs : ils ont oublié.",
    },
  ],
  featuresTitle: "Votre journée, du premier client au dernier, sans paperasse derrière.",
  features: [
    {
      label: "Certificat sur place",
      title: "Signé avant de remonter dans le camion",
      text: "Vous cochez ce que vous avez fait, le client signe sur l’écran. Il reçoit son PDF par mail dans la foulée.",
      bullets: [
        "Mentions obligatoires vérifiées avant la signature",
        "Votre SIRET, votre assurance et votre qualification déjà remplis",
        "Une fois signé, le certificat ne se modifie plus",
      ],
      visual: {
        title: "Certificat n° 2026-0142",
        subtitle: "Mme Durand · 14 octobre 2026",
        status: {
          label: "Signé",
          tone: "validated",
        },
        rows: [
          {
            label: "Ramonage mécanique",
            value: "Conduit tubé inox Ø 150",
            tag: "Fait",
          },
          {
            label: "Vacuité",
            value: "Vérifiée sur toute la longueur",
            tag: "Fait",
          },
          {
            label: "Signature du client",
            value: "Mme Durand, 10 h 42",
            tag: "Signé",
          },
          {
            label: "Envoi",
            value: "marie.durand@email.fr",
            tag: "Envoyé",
          },
        ],
      },
    },
    {
      label: "Hors ligne",
      title: "La cave, la campagne, la panne : tout s’ouvre quand même",
      text: "Vos fiches clients sont enregistrées dans le téléphone. Ce que vous notez sans réseau part tout seul quand il revient.",
      bullets: [
        "Adresse, digicode et téléphone de l’occupant",
        "Appareils, conduits, photos et notes",
        "Un badge indique ce qui reste à envoyer",
      ],
      visual: {
        title: "Mme Durand",
        subtitle: "12 rue des Lilas, 94100 Saint-Maur",
        status: {
          label: "Hors ligne",
          tone: "warning",
        },
        rows: [
          {
            label: "Digicode",
            value: "4721B · 3e étage, porte G",
          },
          {
            label: "Occupant",
            value: "M. Petit · 06 12 34 56 78",
          },
          {
            label: "Poêle à bois",
            value: "Dernier ramonage : 14 oct. 2025",
          },
          {
            label: "À envoyer",
            value: "1 note, 2 photos",
            tag: "En attente",
          },
        ],
      },
    },
    {
      label: "Relances",
      title: "Vos clients reviennent sans que vous les relanciez",
      text: "À l’échéance, Passalio écrit au client à votre nom. Il vous rappelle ou répond directement au mail.",
      bullets: [
        "Mail envoyé onze mois après le passage",
        "Signé de votre nom, avec votre numéro",
        "La liste des échéances du mois dans l’application",
      ],
      visual: {
        title: "Votre ramonage annuel arrive à échéance",
        subtitle: "De : Ramonage Martin · 14 sept. 2027",
        rows: [
          {
            label: "Bonjour Madame Durand,",
            value: "votre dernier ramonage date du 14 octobre 2026.",
          },
          {
            label: "Pour prendre rendez-vous",
            value: "appelez le 06 12 34 56 78 ou répondez à ce mail.",
          },
        ],
      },
    },
    {
      label: "Fiches clients",
      title: "Toute l’histoire d’un client au même endroit",
      text: "Un assureur, un notaire ou un client vous demande un ancien certificat ? Il est dans la fiche, en deux secondes.",
      bullets: [
        "Lieux, appareils et conduits de chaque client",
        "Tous les certificats signés, rangés par date",
        "La plaque de l’appareil lue en photo",
      ],
      visual: {
        title: "Historique",
        subtitle: "Mme Durand · Poêle à bois",
        rows: [
          {
            label: "Certificat n° 2026-0142",
            value: "14 octobre 2026",
            tag: "PDF",
          },
          {
            label: "Certificat n° 2025-0098",
            value: "14 octobre 2025",
            tag: "PDF",
          },
          {
            label: "Certificat n° 2024-0071",
            value: "9 octobre 2024",
            tag: "PDF",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Est-ce que ça remplace mon carnet ?",
      answer:
        "Oui. Le certificat contient les mentions obligatoires et le client le reçoit signé. Vous pouvez garder le carnet en secours au début.",
    },
    {
      question: "Je ne suis pas à l’aise avec l’informatique.",
      answer:
        "Passalio s’utilise comme une application de téléphone. Si vous voulez, Antho vous l’installe au téléphone en 15 minutes.",
    },
  ],
  finalTitle: "Essayez-le sur votre prochain ramonage.",
};
