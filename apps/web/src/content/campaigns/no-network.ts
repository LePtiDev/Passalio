export const noNetworkCampaign = {
  slug: "sans-reseau",
  seo: {
    title: "Sans réseau, vos fiches s’ouvrent quand même | Passalio",
    description:
      "Le réseau mobile est tombé en pleine tournée. Avec Passalio, l’adresse, le digicode et les appareils de chaque client restent dans votre téléphone.",
  },
  card: {
    moment: "Mercredi 21 octobre, 11 h 20",
    quote: "« Aucun service. »",
    theme: "navy",
    title: "Mercredi, plus de réseau en pleine tournée",
    summary:
      "Devant la porte de Mme Durand, le digicode est dans un SMS qui ne s’ouvre plus. Ce qui reste dans le téléphone quand tout tombe.",
    activity: "Ramoneur seul",
    minutes: 3,
  },
  eyebrow: "Mercredi 21 octobre, réseau mobile coupé",
  titleLines: ["Plus de réseau.", "Vos fiches s’ouvrent quand même."],
  lead: "Mercredi, le réseau mobile est tombé une bonne partie de la journée. Avec Passalio, l’adresse, le digicode et les appareils de chaque client sont enregistrés dans votre téléphone. Ce que vous notez part tout seul quand le réseau revient.",
  primaryAction: "Être rappelé pour une démo",
  secondaryAction: "Comment ça marche",
  highlights: ["Démo de 15 minutes", "Sans engagement", "iPhone et Android"],
  phone: {
    label: "Fiche client ouverte sans réseau sur le téléphone",
    backLabel: "Clients",
    status: "Hors ligne",
    customer: "Mme Durand",
    address: "12 rue des Lilas, 94100 Saint-Maur",
    accessCodeLabel: "Digicode",
    accessCode: "4721B",
    floorLabel: "Étage",
    floor: "3e, porte G",
    occupantLabel: "Occupant",
    occupant: "M. Petit · 06 12 34 56 78",
    equipmentLabel: "Appareil",
    equipment: "Poêle à bois · Tubé inox Ø 150",
    lastSweep: "Dernier ramonage : 14 oct. 2025",
    pending: "2 modifications à envoyer au retour du réseau",
    toastTitle: "Réseau revenu",
    toastText: "Tout est à jour.",
  },
  comparison: {
    eyebrow: "Mercredi, en tournée",
    title: "Ce qui vous a manqué, et où Passalio le garde.",
    headers: ["Ce qu’il vous fallait", "Sans réseau, d’habitude", "Avec Passalio"],
    rows: [
      [
        "Le digicode",
        "Dans un SMS ou un mail qui ne charge plus",
        "Sur la fiche du client, dans le téléphone",
      ],
      [
        "L’adresse suivante",
        "Dans un agenda en ligne",
        "Dans le planning du jour, déjà enregistré",
      ],
      [
        "Le dernier ramonage",
        "Dans le classeur, au bureau",
        "Sur l’appareil du client, avec sa date",
      ],
      [
        "Ce que vous notez",
        "Sur un papier, à recopier le soir",
        "Enregistré, envoyé au retour du réseau",
      ],
    ],
  },
  steps: {
    eyebrow: "Comment ça marche",
    title: "Le téléphone garde une copie. Vous n’avez rien à faire.",
    items: [
      {
        title: "Avant de partir",
        text: "Quand vous ouvrez Passalio avec du réseau, vos clients, leurs appareils et le planning du jour sont copiés dans le téléphone.",
      },
      {
        title: "Sans réseau",
        text: "Panne, cave, campagne : tout s’ouvre. Vous ajoutez une note, une photo, un appareil. Un petit badge vous dit ce qui reste à envoyer.",
      },
      {
        title: "Le réseau revient",
        text: "Tout part seul, sans bouton à presser. Votre associé ou votre secrétaire voit les changements au bureau.",
      },
    ],
    availableLabel: "Déjà sans réseau",
    available: [
      "Fiches clients",
      "Codes d’accès",
      "Appareils",
      "Photos et notes",
      "Planning du jour",
    ],
    upcomingLabel: "Bientôt",
    upcoming: ["Certificat signé sur le téléphone", "PDF envoyé au client"],
  },
  callback: {
    eyebrow: "15 minutes, au téléphone",
    title: "On vous montre Passalio sur votre propre téléphone.",
    lead: "Laissez votre numéro et le moment qui vous arrange. On vous rappelle, on installe l’application avec vous et on coupe le réseau pour essayer.",
    mailNote: "Vous avez reçu notre mail ? Vous pouvez aussi y répondre directement.",
  },
} as const;

export type NoNetworkCampaign = typeof noNetworkCampaign;
