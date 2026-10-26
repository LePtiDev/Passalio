import type { MarketingPageInput } from "../content-schema";

export const certificatePage: MarketingPageInput = {
  slug: "certificat-de-ramonage",
  isPublished: true,
  seo: {
    title: "Certificat de ramonage sur téléphone | Passalio",
    description:
      "Remplissez le certificat de ramonage chez le client : mentions obligatoires vérifiées, signature sur l’écran, PDF prêt à partager.",
  },
  menu: {
    title: "Certificat de ramonage",
    text: "Rempli et signé chez le client.",
    icon: "document",
  },
  eyebrow: "Produit · Certificat de ramonage",
  title: "Un certificat complet, signé chez le client, en quelques minutes.",
  lead: "Vous cochez ce que vous avez fait, Passalio vérifie qu’il ne manque aucune mention, le client signe sur l’écran et vous lui partagez le PDF.",
  highlights: [
    "Mentions de l’arrêté du 20 juillet 2023",
    "Non modifiable une fois signé",
    "Même sans réseau",
  ],
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
        label: "Anomalie",
        value: "Aucune",
      },
    ],
    action: "Faire signer le client",
  },
  pains: [
    {
      title: "Le carnet",
      text: "Le double carbone, le SIRET recopié à la main, la case oubliée.",
    },
    {
      title: "Le soir",
      text: "Scanner, envoyer, ranger. Une heure de plus après la tournée.",
    },
    {
      title: "Deux ans après",
      text: "L’assureur demande le certificat. Il faut le retrouver.",
    },
  ],
  featuresTitle: "Tout ce qu’un certificat doit contenir, sans y penser.",
  features: [
    {
      label: "Sur place",
      title: "Vous cochez, Passalio remplit le reste",
      text: "Le client, l’appareil et le conduit sont déjà dans la fiche. Votre entreprise, votre assurance et votre qualification aussi.",
      bullets: [
        "Méthode de ramonage, vacuité, état du conduit",
        "Anomalies et conduit déconseillé",
        "Date du prochain ramonage conseillée",
      ],
      visual: {
        title: "Votre entreprise, déjà remplie",
        subtitle: "Sur chaque certificat",
        rows: [
          {
            label: "Ramonage Martin",
            value: "SIRET 812 345 678 00019",
          },
          {
            label: "Assurance RC pro",
            value: "Police n° 4471-209",
          },
          {
            label: "Technicien",
            value: "Julien Martin",
          },
        ],
      },
    },
    {
      label: "Contrôle",
      title: "Impossible de signer un certificat incomplet",
      text: "Avant la signature, Passalio vérifie les mentions demandées par le règlement sanitaire et l’arrêté. Il vous dit ce qui manque, en clair.",
      bullets: [
        "Mentions obligatoires vérifiées une par une",
        "Message précis sur ce qui manque",
        "Rien n’est bloqué sans explication",
      ],
      visual: {
        title: "Avant la signature",
        subtitle: "1 point à compléter",
        status: {
          label: "À compléter",
          tone: "warning",
        },
        rows: [
          {
            label: "Longueur du conduit",
            value: "À renseigner avant la signature",
            tag: "Manque",
          },
          {
            label: "Vacuité",
            value: "Vérifiée",
            tag: "OK",
          },
          {
            label: "Combustible",
            value: "Bois bûche",
            tag: "OK",
          },
        ],
      },
    },
    {
      label: "Signature et envoi",
      title: "Signé sur l’écran, partagé tout de suite, gardé tel quel",
      text: "Le client signe avec le doigt, même sans réseau. Le PDF est prêt sur le téléphone : vous le partagez ou le téléchargez. Signé, le certificat ne se modifie plus.",
      bullets: [
        "PDF à vos couleurs, avec votre logo",
        "Un numéro unique par certificat",
        "Conseils d’utilisation joints pour le bois",
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
            label: "Signature du client",
            value: "Mme Durand, 10 h 42",
            tag: "Signé",
          },
          {
            label: "PDF",
            value: "Certificat et conseils d’utilisation",
            tag: "Prêt",
          },
          {
            label: "Modification",
            value: "Impossible après signature",
            tag: "Verrouillé",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Le certificat est-il conforme ?",
      answer:
        "Il reprend les mentions du règlement sanitaire départemental et de l’arrêté du 20 juillet 2023. Elles sont vérifiées avant chaque signature.",
    },
    {
      question: "Et si je me suis trompé après la signature ?",
      answer: "Un certificat signé ne se modifie pas : c’est ce qui en fait une preuve.",
    },
  ],
  finalTitle: "Faites votre prochain certificat sur Passalio.",
};
