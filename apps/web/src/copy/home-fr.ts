export const homeFr = {
  hero: {
    badge: "Nouveau",
    news: "Certificat de ramonage signé sur place, même sans réseau",
    titleStart: "Ramonage et entretien,",
    titleEnd: "du rendez-vous à la relance.",
    lead: "Le logiciel des pros du conduit et de l’appareil : ramoneurs, poêliers, chauffagistes. Planning, fiches clients, équipe et certificats signés sur place. Sur le téléphone, même sans réseau.",
    primary: "Essayer gratuitement",
    secondary: "Être rappelé pour une démo",
    highlights: [
      "Sans engagement",
      "Fonctionne sans réseau",
      "iPhone, Android et ordinateur",
      "Hébergé en Europe",
    ],
  },
  visual: {
    label:
      "Aperçu de Passalio : le planning de la semaine sur ordinateur et une fiche client sur le téléphone",
    address: "app.passalio.com/planning",
    company: "Ramonage Martin",
    navigation: ["Aujourd’hui", "Planning", "Clients", "Équipe", "Réglages"],
    currentNavigation: "Planning",
    week: "Semaine du 19 octobre",
    weekSummary: "23 passages · 3 techniciens",
    dayView: "Jour",
    weekView: "Semaine",
    days: ["Lun. 19", "Mar. 20", "Mer. 21", "Jeu. 22"],
    technicians: [
      {
        name: "Julien",
        visits: [
          { time: "8 h", customer: "Mme Durand", place: "Saint-Maur", state: "confirmed" },
          { time: "9 h", customer: "M. Roux", place: "Créteil", state: "confirmed" },
          { time: "14 h", customer: "Mme Petit", place: "À confirmer", state: "pending" },
          { time: "8 h", customer: "M. Blanc", place: "Vincennes", state: "confirmed" },
        ],
      },
      {
        name: "Kevin",
        visits: [
          { time: "10 h", customer: "M. Faure", place: "Joinville", state: "planned" },
          null,
          { time: "8 h", customer: "M. Garnier", place: "Maisons-Alfort", state: "planned" },
          { time: "13 h", customer: "Mme Morel", place: "Champigny", state: "planned" },
        ],
      },
      {
        name: "Léa",
        visits: [
          null,
          { time: "11 h", customer: "M. Lucas", place: "Bry-sur-Marne", state: "confirmed" },
          { time: "9 h", customer: "Mme Girard", place: "Fontenay", state: "confirmed" },
          { time: "15 h", customer: "M. André", place: "Le Perreux", state: "confirmed" },
        ],
      },
    ],
    phone: {
      back: "Clients",
      status: "Hors ligne",
      customer: "Mme Durand",
      address: "12 rue des Lilas, Saint-Maur",
      fields: [
        { label: "Digicode", value: "4721B" },
        { label: "Étage", value: "3e, porte G" },
      ],
      details: [
        { label: "Appareil", value: "Poêle à bois · Tubé Ø 150" },
        { label: "Dernier ramonage", value: "14 oct. 2025" },
        { label: "Occupant", value: "M. Petit · 06 12 34 56 78" },
      ],
      pending: "2 modifications à envoyer au retour du réseau",
    },
    confirmedTitle: "Mme Leroy a confirmé",
    confirmedText: "Vendredi 23, 10 h avec Julien",
    syncedTitle: "Réseau revenu",
    syncedText: "2 modifications envoyées au bureau",
  },
  proofs: [
    { title: "0 ressaisie", text: "Ce qui est noté sur place arrive au bureau." },
    { title: "Sans réseau", text: "Fiches, codes et planning dans le téléphone." },
    { title: "Un planning", text: "Le bureau et les techniciens voient le même." },
    { title: "15 minutes", text: "Pour une démo, sur votre propre téléphone." },
  ],
  product: {
    eyebrow: "Produit",
    title: "Tout votre métier, réuni au même endroit.",
    lead: "Huit outils pensés pour le conduit et l’appareil. Ceux marqués « Bientôt » arrivent dans les prochains mois.",
    discover: "Découvrir",
    soon: "Bientôt",
  },
  activities: {
    eyebrow: "Vous êtes",
    title: "Seul, à plusieurs ou à côté du chauffage. Passalio suit votre façon de travailler.",
    action: "Voir la page",
  },
  trust: {
    title: "Vos données et vos documents, en sécurité.",
    items: [
      {
        icon: "europe",
        title: "Hébergé en Europe",
        text: "Vos clients ne quittent pas l’Union européenne.",
      },
      {
        icon: "export",
        title: "Vos données vous appartiennent",
        text: "Vous exportez vos clients quand vous voulez.",
      },
      {
        icon: "lock",
        title: "Document signé, non modifiable",
        text: "Ce que le client a signé reste tel quel.",
      },
      {
        icon: "france",
        title: "Conçu en France",
        text: "Une équipe joignable par téléphone.",
      },
    ],
  },
  callback: {
    eyebrow: "15 minutes, au téléphone",
    title: "Essayez Passalio sur votre prochaine tournée.",
    lead: "Créez votre compte en deux minutes. Ou laissez votre numéro : on vous rappelle et on l’installe avec vous.",
    action: "Essayer gratuitement",
  },
} as const;

export type TrustIcon = (typeof homeFr.trust.items)[number]["icon"];
