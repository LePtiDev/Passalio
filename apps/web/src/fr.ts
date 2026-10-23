export const fr = {
  meta: {
    title: "Passalio, le logiciel des ramoneurs pour les attestations et les relances",
    description:
      "Remplissez l'attestation de ramonage chez le client, faites-la signer sur le téléphone, envoyez-la par email. Passalio relance le client l'année suivante.",
  },
  brand: "Passalio",
  nav: {
    label: "Navigation principale",
    passage: "Comment ça se passe",
    questions: "Questions",
    signIn: "Se connecter",
    tryFree: "Essayer gratuitement",
  },
  hero: {
    eyebrow: "Pour les ramoneurs, seuls ou en équipe",
    title: "Chaque passage, en règle.",
    lead: "Vous remplissez l'attestation chez le client, sur votre téléphone. Il signe sur l'écran et la reçoit par email. Un an plus tard, Passalio lui rappelle de vous rappeler.",
    primary: "Essayer gratuitement",
    secondary: "Voir comment ça se passe",
    highlights: ["Sans engagement", "Fonctionne sans réseau", "iPhone et Android"],
    phone: {
      label: "Aperçu d'une attestation remplie sur le téléphone",
      customer: "Mme Durand · Saint-Maur",
      title: "Attestation de ramonage",
      flueLabel: "Conduit",
      flue: "Poêle à bois, salon",
      flueDetail: "Tubé inox Ø 150, 7 m",
      checks: [
        "Ramonage mécanique par le haut",
        "Vacuité vérifiée sur toute la longueur",
        "2 photos jointes",
      ],
      signature: "Signature du client",
      submit: "Signer et envoyer",
    },
    toastTitle: "Attestation envoyée à Mme Durand.",
    toastText: "Prochain passage prévu en octobre 2027.",
  },
  pains: {
    eyebrow: "Le constat",
    title: "Ce qui vous prend du temps, ce n'est pas le conduit.",
    lead: "Le ramonage, vous savez faire. C'est le papier autour qui déborde, surtout de septembre à décembre.",
    items: [
      {
        moment: "Chez le client",
        text: "Le carnet posé sur le capot, le double carbone qui bave, le SIRET à recopier à chaque fois. Et le client qui demande s'il peut l'avoir par mail.",
      },
      {
        moment: "Le soir",
        text: "Ressortir les attestations du camion, les scanner, les envoyer à ceux qui les attendent. Une heure de plus, après la journée.",
      },
      {
        moment: "L'année suivante",
        text: "Une partie des clients ne rappelle pas. Pas parce qu'ils sont partis ailleurs : ils ont oublié. Et personne n'a le temps de les rappeler un par un.",
      },
      {
        moment: "Le jour où on vous la demande",
        text: "Un sinistre, un assureur, une maison qui se vend : il faut retrouver l'attestation de M. Martin d'il y a deux ans. Dans quel carnet ?",
      },
    ],
  },
  passage: {
    eyebrow: "Avec Passalio",
    step: (number: number) => `Étape ${number}`,
    title: "Un passage, du départ à l'année suivante.",
    lead: "Vous faites votre travail comme d'habitude. Le téléphone remplace le carnet, et ce qui se faisait le soir se fait tout seul.",
    before: {
      title: "Avant de sonner",
      text: "Le client, son adresse, son appareil et la date du dernier passage sont dans votre téléphone. Même au fond d'une cave sans réseau : tout est enregistré sur l'appareil et se synchronise plus tard.",
      customer: "Mme Durand",
      address: "12 rue des Lilas, 94100 Saint-Maur",
      offline: "Hors ligne",
      fields: [
        { label: "Appareil", value: "Poêle à bois" },
        { label: "Conduit", value: "Tubé inox Ø 150" },
        { label: "Dernier ramonage", value: "14 oct. 2025" },
        { label: "Dernier entretien", value: "14 oct. 2025" },
      ],
    },
    onSite: {
      title: "Sur place",
      text: "Vous cochez ce que vous avez fait, vous notez une anomalie, vous ajoutez une photo. Votre SIRET, votre assurance et votre qualification sont déjà sur l'attestation. S'il manque une mention obligatoire, vous le voyez avant de faire signer.",
      heading: "Votre entreprise, déjà remplie",
      fields: [
        { label: "Entreprise", value: "Ramonage Martin" },
        { label: "SIRET", value: "812 345 678 00019" },
        { label: "Assurance RC pro", value: "Police n° 4471-209" },
        { label: "Technicien", value: "Julien Martin" },
      ],
      warning: "Longueur du conduit à renseigner avant la signature.",
    },
    leaving: {
      title: "En partant",
      text: "Le client signe sur l'écran et reçoit le PDF par email. Vous en gardez une copie, rangée dans sa fiche. Une fois signée, l'attestation ne peut plus être modifiée : dans deux ans, c'est votre preuve.",
      to: "À : marie.durand@email.fr",
      subject: "Votre attestation de ramonage, Ramonage Martin",
      file: "attestation-2026-0142.pdf",
      signedOn: "Signée le 14 octobre 2026",
      locked: "Signée, non modifiable",
    },
    nextYear: {
      title: "Onze mois plus tard",
      text: "Passalio écrit au client, à votre nom, que son ramonage arrive à échéance. Il vous rappelle ou répond au message. Vous n'avez rien eu à noter ni à relancer.",
      from: "De : Ramonage Martin",
      date: "14 sept. 2027",
      subject: "Votre ramonage annuel arrive à échéance",
      body: "Bonjour Madame Durand, votre dernier ramonage date du 14 octobre 2026. Il est obligatoire chaque année. Pour prendre rendez-vous, appelez-nous au 06 12 34 56 78 ou répondez à ce message.",
    },
  },
  documents: {
    eyebrow: "Ramonage et entretien",
    title: "Le conduit et l'appareil, deux attestations.",
    text: "Depuis le 1er octobre 2023, le ramonage du conduit et l'entretien d'un poêle ou d'un insert sont deux obligations, avec chacune son document. Passalio produit les deux, chacun avec les mentions que demandent le décret et l'arrêté du 20 juillet 2023, conseils au client compris.",
    items: [
      {
        kind: "Le conduit",
        title: "Attestation de ramonage",
        points: [
          "Conduits ramonés, identifiés",
          "Vacuité sur toute la longueur",
          "Raccordement compris",
          "Nom et signature du ramoneur",
        ],
      },
      {
        kind: "L'appareil",
        title: "Attestation d'entretien",
        points: [
          "Poêle ou insert identifié",
          "Points contrôlés, un par un",
          "Conseils d'usage au client",
          "Dates du dernier ramonage et entretien",
        ],
      },
    ],
  },
  team: {
    eyebrow: "Seul ou à plusieurs",
    title: "Chacun son compte, vous voyez tout.",
    lead: "Votre salarié ou votre apprenti a son propre accès. Il voit ses rendez-vous et ses clients, il signe avec son nom. Vous, vous voyez l'ensemble et vous savez qui est passé où.",
    today: "Aujourd'hui",
    date: "Mardi 14 octobre",
    members: [
      {
        name: "Julien Martin",
        initials: "JM",
        activity: "6 passages, 4 signés",
        role: "Patron",
        isOwner: true,
      },
      {
        name: "Kevin Robert",
        initials: "KR",
        activity: "5 passages, 5 signés",
        role: "Technicien",
        isOwner: false,
      },
      {
        name: "Léa Petit",
        initials: "LP",
        activity: "3 passages, 1 signé",
        role: "Apprentie",
        isOwner: false,
      },
    ],
  },
  reassurance: [
    {
      title: "Pas de réseau, pas de problème",
      text: "Cave, grenier, campagne : vous remplissez et faites signer quand même. Les envois partent dès que le téléphone capte, et vous voyez ce qui attend.",
    },
    {
      title: "Vos clients actuels",
      text: "Votre fichier Excel ou CSV s'importe en une fois. Les échéances repartent de la date du dernier passage.",
    },
    {
      title: "Vos données restent à vous",
      text: "Hébergées en Europe. Vous exportez vos clients et vos attestations quand vous voulez, y compris si vous partez.",
    },
  ],
  faq: {
    title: "Vos questions",
    items: [
      {
        question: "Est-ce que ça remplace mon carnet ?",
        answer:
          "Oui. L'attestation contient les mentions obligatoires et le client la reçoit signée. Vous pouvez garder le carnet en secours les premières semaines.",
      },
      {
        question: "Il faut installer une application ?",
        answer:
          "Non. Passalio s'ouvre dans le navigateur de votre téléphone et s'ajoute à l'écran d'accueil, comme une application. iPhone et Android.",
      },
    ],
  },
  finalCall: {
    title: "Essayez-le sur votre prochaine intervention.",
    lead: "Créez votre compte, ajoutez un client, faites signer une première attestation, sur votre propre téléphone.",
    action: "Essayer gratuitement",
  },
  footer: {
    label: "Liens du pied de page",
    signIn: "Se connecter",
    terms: "Conditions",
    privacy: "Confidentialité",
    legalNotice: "Mentions légales",
    copyright: (year: number) => `© ${year} Passalio`,
  },
} as const;
