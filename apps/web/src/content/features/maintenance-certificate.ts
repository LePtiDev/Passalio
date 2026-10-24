import type { MarketingPageInput } from "../content-schema";

export const maintenanceCertificatePage: MarketingPageInput = {
  slug: "attestation-entretien",
  isPublished: false,
  seo: {
    title: "Attestation d’entretien de poêle | Passalio",
    description:
      "L’attestation d’entretien des poêles et inserts, bois ou granulés, faite avec le ramonage et signée une seule fois par le client.",
  },
  menu: {
    title: "Attestation d’entretien",
    text: "Poêles et inserts, bois et granulés.",
    icon: "flame",
  },
  eyebrow: "Produit · Attestation d’entretien",
  title: "L’entretien du poêle a son attestation. Elle se fait en même temps que le ramonage.",
  lead: "Depuis le 1er octobre 2023, l’entretien annuel d’un poêle ou d’un insert demande son propre document. Passalio le prépare à côté du certificat de ramonage, pour une seule signature.",
  highlights: ["Bois et granulés", "Poêles et inserts", "Une seule signature"],
  screen: {
    backLabel: "M. Laurent",
    status: {
      label: "Hors ligne",
      tone: "warning",
    },
    title: "Attestation d’entretien",
    subtitle: "Poêle à granulés · 8 kW",
    rows: [
      {
        label: "Appareil identifié",
        value: "Marque, modèle, puissance",
        tag: "Fait",
      },
      {
        label: "Points contrôlés",
        value: "6 sur 6",
        tag: "Fait",
      },
      {
        label: "Conseils d’usage",
        value: "Notés pour le client",
      },
      {
        label: "Prochain entretien",
        value: "Octobre 2027",
      },
    ],
    action: "Faire signer le client",
  },
  pains: [
    {
      title: "Deux obligations",
      text: "Le conduit et l’appareil ne demandent pas les mêmes mentions.",
    },
    {
      title: "Deux papiers",
      text: "Un carnet pour le ramonage, une feuille pour l’entretien.",
    },
    {
      title: "Le client perdu",
      text: "Il ne sait plus lequel garder pour l’assurance.",
    },
  ],
  featuresTitle: "Le conduit et l’appareil, chacun son document, en une visite.",
  features: [
    {
      label: "Deux documents",
      title: "Ramonage et entretien, signés ensemble",
      text: "Vous faites le ramonage puis l’entretien. Le client signe une fois, il reçoit les deux PDF dans le même mail.",
      bullets: [
        "Chaque document avec ses mentions",
        "Une seule signature du client",
        "Les deux rangés sur l’appareil",
      ],
      visual: {
        title: "Visite du 14 octobre",
        subtitle: "M. Laurent · Nogent-sur-Marne",
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
            value: "laurent.p@email.fr",
            tag: "Envoyé",
          },
        ],
      },
    },
    {
      label: "Points contrôlés",
      title: "Les contrôles de l’appareil, cochés un par un",
      text: "La liste suit le type d’appareil et le combustible. Vous notez une usure ou une pièce à changer en un geste.",
      bullets: [
        "Liste adaptée au bois ou au granulé",
        "Observation et photo sur chaque point",
        "Pièces à changer signalées au client",
      ],
      visual: {
        title: "Points contrôlés",
        subtitle: "Poêle à granulés 8 kW",
        status: {
          label: "5 sur 6",
          tone: "validated",
        },
        rows: [
          {
            label: "Nettoyage du foyer et du brûleur",
            value: "",
            tag: "Fait",
          },
          {
            label: "Joints de porte",
            value: "Usés, à changer",
            tag: "Noté",
          },
          {
            label: "Évacuation des fumées",
            value: "",
            tag: "Fait",
          },
        ],
      },
    },
    {
      label: "Conseils d’usage",
      title: "Les conseils au client, écrits sur l’attestation",
      text: "L’arrêté demande de conseiller le client sur le bon usage de son appareil. Vos conseils sont notés et lui restent.",
      bullets: [
        "Combustible adapté",
        "Réglages et entretien courant",
        "Gardés dans l’historique de l’appareil",
      ],
      visual: {
        title: "Conseils d’usage",
        subtitle: "Remis à M. Laurent",
        rows: [
          {
            label: "Combustible",
            value: "Granulés certifiés, stockés au sec",
          },
          {
            label: "Entretien courant",
            value: "Vider le cendrier chaque semaine",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Les inserts sont-ils prévus ?",
      answer: "Oui : poêles et inserts, au bois et aux granulés.",
    },
    {
      question: "Et les chaudières à bois ?",
      answer: "[À confirmer selon le texte applicable]",
    },
    {
      question: "Le modèle d’attestation est-il vérifié ?",
      answer:
        "Les mentions viennent de l’arrêté du 20 juillet 2023. [Relecture sur un document réel en cours]",
    },
  ],
  finalTitle: "Faites votre prochain entretien sur Passalio.",
};
