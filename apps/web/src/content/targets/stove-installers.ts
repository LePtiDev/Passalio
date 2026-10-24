import type { MarketingPageInput } from "../content-schema";

export const stoveInstallersPage: MarketingPageInput = {
  slug: "poeliers-installateurs",
  isPublished: true,
  seo: {
    title: "Logiciel pour poêliers et installateurs | Passalio",
    description:
      "Ramonage et entretien du poêle en une visite, fiche appareil remplie depuis une photo de la plaque, suivi de chaque poêle posé, année après année.",
  },
  menu: {
    title: "Poêliers et installateurs",
    text: "Deux attestations en une visite.",
    icon: "flame",
  },
  eyebrow: "Pour les poêliers et installateurs",
  title: "Chaque poêle posé devient un entretien, chaque année.",
  lead: "Le ramonage du conduit et l’entretien de l’appareil, deux attestations signées en une visite. Puis Passalio rappelle vos clients à l’échéance, à votre nom.",
  highlights: ["Bois et granulés", "Poêles et inserts", "Sans engagement"],
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
        value: "Un par un, cochés",
        tag: "Fait",
      },
      {
        label: "Conseils d’usage",
        value: "Notés pour le client",
      },
      {
        label: "Prochain entretien",
        value: "Dans 12 mois",
      },
    ],
    action: "Faire signer le client",
  },
  pains: [
    {
      title: "Deux papiers",
      text: "Le conduit et l’appareil ne demandent pas les mêmes mentions. Deux documents à chaque visite.",
    },
    {
      title: "La plaque",
      text: "Marque, modèle, numéro de série, recopiés à genoux devant l’appareil.",
    },
    {
      title: "Les poses d’il y a trois ans",
      text: "Des clients que personne ne rappelle pour l’entretien, et que le voisin récupère.",
    },
  ],
  featuresTitle: "De la pose à l’entretien annuel, sans rien laisser filer.",
  features: [
    {
      label: "Deux attestations",
      title: "Le conduit et l’appareil, en une seule visite",
      text: "Depuis l’arrêté du 20 juillet 2023, le ramonage et l’entretien d’un poêle ou d’un insert ont chacun leur document. Passalio prépare les deux.",
      bullets: [
        "Chaque document avec ses mentions obligatoires",
        "Une seule signature du client",
        "Les deux PDF envoyés ensemble",
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
      label: "Plaque signalétique",
      title: "Photographiez la plaque, la fiche de l’appareil se remplit",
      text: "Plus besoin de recopier la plaque à genoux. Passalio lit la photo et remplit les champs vides. Vous vérifiez avant de signer.",
      bullets: [
        "Marque, modèle, puissance, numéro de série",
        "Champs lus marqués « à vérifier »",
        "Rien n’est écrasé dans ce que vous avez déjà saisi",
      ],
      visual: {
        title: "Lu sur la plaque",
        subtitle: "Photo prise à 10 h 12",
        status: {
          label: "À vérifier",
          tone: "warning",
        },
        rows: [
          {
            label: "Marque",
            value: "MCZ",
          },
          {
            label: "Modèle",
            value: "Ego 8",
          },
          {
            label: "Puissance",
            value: "8 kW",
          },
          {
            label: "Combustible",
            value: "Granulés de bois",
          },
        ],
      },
    },
    {
      label: "Suivi des poses",
      title: "Vos clients de la pose reviennent chaque année",
      text: "Chaque appareil posé a sa date d’échéance. Onze mois après, Passalio écrit au client à votre nom.",
      bullets: [
        "Date de pose et prochaine échéance par appareil",
        "Relance par mail, signée de votre entreprise",
        "La liste des entretiens du mois",
      ],
      visual: {
        title: "Entretiens de novembre",
        subtitle: "24 appareils",
        rows: [
          {
            label: "M. Laurent",
            value: "Poêle à granulés · posé en 2023",
            tag: "Mail envoyé",
          },
          {
            label: "Mme Roux",
            value: "Insert bois · posé en 2022",
            tag: "A rappelé",
          },
          {
            label: "M. et Mme Faure",
            value: "Poêle à bois · posé en 2024",
            tag: "À relancer",
          },
        ],
      },
    },
    {
      label: "Sur place",
      title: "Les points contrôlés cochés un par un, devant le client",
      text: "L’attestation se remplit pendant l’entretien. Le client voit ce que vous avez fait et signe sur l’écran.",
      bullets: [
        "Points contrôlés sur l’appareil",
        "Conseils d’usage notés sur l’attestation",
        "Historique de l’appareil sur plusieurs années",
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
          {
            label: "Conseils d’usage",
            value: "Granulés certifiés, vider le cendrier",
            tag: "Fait",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Les appareils à granulés sont-ils prévus ?",
      answer: "Oui : bois et granulés, poêles et inserts.",
    },
    {
      question: "Je fais aussi l’installation et la vente.",
      answer:
        "Passalio ne fait pas encore les devis et les factures. Il s’occupe des passages, des attestations et des relances.",
    },
    {
      question: "La photo de la plaque remplit tout ?",
      answer:
        "Elle remplit les champs vides, marqués « à vérifier ». C’est vous qui validez avant de signer.",
    },
  ],
  finalTitle: "Essayez-le sur votre prochain entretien.",
};
