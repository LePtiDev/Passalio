const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;
const OPEN_ACCOUNT_HINT = "Ouvrez-en une pour voir son personnel, son utilisation et son journal.";

export const backofficeFr = {
  shell: {
    navigation: "Navigation de l'espace admin",
    space: "Espace admin",
    badge: "Admin",
    commercial: "Commercial",
    myDay: "Ma journée",
    calls: "Appels",
    platform: "Plateforme",
    companies: "Entreprises",
    contacts: "Contacts",
    prospection: "Prospection",
    overview: "Vue d'ensemble",
    accounts: "Comptes clients",
    accountsShort: "Comptes",
    overviewShort: "Accueil",
    journal: "Journal",
  },
  overview: {
    title: "Vue d'ensemble",
    subtitle: (month: string) => `Comptes clients et utilisation de Passalio, ${month}.`,
    mobileSubtitle: (month: string) => `Espace admin · ${month}`,
    accounts: "Comptes clients",
    accountsHint: "toutes les entreprises inscrites",
    trial: "En essai",
    trialHint: (endingSoon: number) =>
      endingSoon === 0
        ? "aucun ne finit cette semaine"
        : `${endingSoon} ${endingSoon === 1 ? "finit" : "finissent"} cette semaine`,
    activePeople: "Personnes actives",
    activePeopleHint: "sur les 30 derniers jours",
    dropping: "Utilisation en baisse",
    droppingHint: "20 % ou plus sur 30 jours",
    droppingTitle: "Utilisation en baisse",
    droppingSubtitle: "30 derniers jours comparés aux 30 précédents",
    droppingEmpty: "Aucune entreprise en baisse. Tout va bien.",
    droppingColumns: {
      history: "6 mois",
      connections: "Connexions",
      change: "Évolution",
    },
    connectionsLabel: (recent: number, previous: number) =>
      `${recent} connexions sur 30 jours, contre ${previous} avant`,
    seeAll: "Tout voir",
    trialsTitle: "Essais qui se terminent",
    trialsSubtitle: "7 prochains jours",
    trialsEmpty: "Aucun essai ne se termine cette semaine.",
    trialLine: (staff: number, activeDays: number) =>
      `${plural(staff, "personne", "personnes")} · ${plural(activeDays, "connexion", "connexions")}`,
    endsOn: (date: string) => `fin le ${date}`,
    movementsTitle: "Derniers mouvements",
    movementsEmpty: "Rien dans le journal pour l'instant.",
    journalLink: "Journal",
  },
  accounts: {
    title: "Comptes clients",
    subtitle: (count: number) =>
      `${plural(count, "entreprise", "entreprises")}. ${OPEN_ACCOUNT_HINT}`,
    subtitleLoading:
      "Ouvrez une entreprise pour voir son personnel, son utilisation et son journal.",
    mobileSubtitle: (count: number, trial: number) => `${count} · ${trial} en essai`,
    filters: { all: "Toutes", trial: "En essai", dropping: "Utilisation en baisse" },
    mobileFilters: { all: "Toutes", trial: "En essai", dropping: "En baisse" },
    filtersLabel: "Filtrer les entreprises",
    searchLabel: "Rechercher une entreprise",
    searchPlaceholder: "Nom de l'entreprise",
    columns: {
      company: "Entreprise",
      subscription: "Abonnement",
      staff: "Personnel",
      usage: "Utilisation",
      lastSeen: "Dernière connexion",
    },
    openPrefix: "Ouvrir",
    open: (name: string) => `Ouvrir ${name}`,
    searchEmptyTitle: (search: string) => `Aucune entreprise pour « ${search} »`,
    searchEmptyText: "La recherche porte sur le nom de l'entreprise.",
    clearSearch: "Effacer la recherche",
    filterEmpty: {
      all: "Aucune entreprise inscrite pour l'instant.",
      trial: "Aucune entreprise en essai.",
      dropping: "Aucune entreprise dont l'utilisation baisse.",
    },
    allEmptyText: "Les entreprises apparaissent ici dès leur inscription sur Passalio.",
    filterEmptyText: "Les autres entreprises restent visibles dans « Toutes ».",
    showAll: "Voir toutes les entreprises",
    copySignUpLink: "Copier le lien d'inscription",
    signUpLinkCopied: "Lien d'inscription copié.",
    loadError: "Impossible de charger les entreprises.",
  },
  status: {
    trial: "Essai",
    trialEnds: (date: string) => `finit le ${date}`,
    trialEnded: "Essai terminé",
    trialEndedOn: (date: string) => `le ${date}`,
  },
  usage: {
    staff: (count: number) => (count === 0 ? "Personne" : plural(count, "personne", "personnes")),
    recentOnly: (count: number) => (count > 1 ? `${count} connexions` : `${count} connexion`),
    never: "Jamais",
    today: "aujourd'hui",
    yesterday: "hier",
    daysAgo: (days: number) => `il y a ${days} j`,
  },
  account: {
    back: "Comptes clients",
    trialPill: (date: string) => `En essai · finit le ${date}`,
    endedPill: "Essai terminé",
    siret: (siret: string) => `SIRET ${siret}`,
    since: (date: string) => `cliente depuis le ${date}`,
    tabs: { people: "Personnel", usage: "Utilisation", journal: "Journal" },
    tabsLabel: "Sections de la fiche",
    notFound: "Ce compte client n'existe plus.",
    backToList: "Retour aux comptes clients",
  },
  people: {
    summary: (people: number, invitations: number) =>
      invitations === 0
        ? `${plural(people, "personne", "personnes")}.`
        : `${plural(people, "personne", "personnes")}, ${plural(invitations, "invitation en attente", "invitations en attente")}.`,
    columns: {
      person: "Personne",
      role: "Rôle",
      lastSeen: "Dernière connexion",
      recent: "Connexions 30 j",
      security: "Sécurité",
    },
    security: { twoFactor: "Code et mot de passe", password: "Mot de passe", blocked: "Bloqué" },
    invitedOn: (date: string) => `invitation du ${date}`,
    notActivated: "Pas encore activé",
    empty: "Personne dans cette entreprise.",
  },
  usagePanel: {
    droppingTitle: (percent: number) => `Utilisation en baisse de ${percent} % sur 30 jours`,
    droppingText: (recent: number, previous: number) =>
      `${plural(recent, "connexion", "connexions")} contre ${previous} les 30 jours précédents.`,
    mainDecliners: (names: readonly string[]) =>
      names.length === 1
        ? ` La baisse vient surtout de ${names[0] ?? ""}.`
        : ` La baisse vient surtout de ${names.slice(0, -1).join(", ")} et ${names.at(-1) ?? ""}.`,
    chartTitle: "Connexions",
    chartSubtitle: "par mois",
    chartLabel: "Connexions par mois sur 6 mois",
    definition: "Une connexion compte un jour où la personne a utilisé Passalio.",
    currentMonth: "mois en cours",
    peopleTitle: "Par personne",
    peopleSubtitle: "30 derniers jours comparés aux 30 précédents",
    columns: {
      person: "Personne",
      previous: "30 jours précédents",
      recent: "30 derniers jours",
      change: "Évolution",
    },
    empty: "Personne n'a encore utilisé Passalio dans cette entreprise.",
  },
  journal: {
    title: "Journal",
    subtitle:
      "Ce que l'équipe Passalio fait sur les comptes, et les grands moments des entreprises. Rien ne s'y modifie ni ne s'efface.",
    mobileSubtitle: "Actions de l'équipe Passalio",
    empty: "Rien dans le journal pour l'instant.",
    emptyText: "Chaque création d'entreprise et chaque action de l'équipe Passalio s'inscrit ici.",
    emptyAction: "Voir les comptes clients",
    today: (date: string) => `Aujourd'hui · ${date}`,
    yesterday: (date: string) => `Hier · ${date}`,
    command: "La commande",
    passalio: "Passalio",
    onBehalf: (name: string) => ` (par ${name}, connecté à sa place)`,
  },
  errors: {
    retry: "Réessayer",
  },
} as const;
