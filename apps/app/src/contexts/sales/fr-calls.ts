import type {
  CallOutcome,
  CallSeriesTarget,
  CertificateVolume,
  DecisionMaker,
  InterestLevel,
  NextAction,
  NotifyMode,
  ProspectTeamSize,
  ScheduledNextAction,
  ToolKind,
} from "@passalio/shared";

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

const OUTCOMES: Readonly<Record<CallOutcome, string>> = {
  answered: "Décroché",
  no_answer: "Pas de réponse",
  voicemail: "Messagerie",
  wrong_number: "Faux numéro",
};

const NEXT_ACTIONS: Readonly<Record<NextAction, string>> = {
  demo: "Démo",
  callback: "Rappel",
  email: "Mail",
  not_interested: "Pas intéressé",
};

const NOTIFY: Readonly<Record<NotifyMode, string>> = {
  minutes_15: "15 min avant",
  day_before: "La veille 18 h",
  at_time: "À l'heure",
  none: "Aucune",
};

const TASK_KINDS: Readonly<Record<ScheduledNextAction, string>> = {
  callback: "Rappel",
  demo: "Démo",
};

const TARGETS: Readonly<Record<CallSeriesTarget, string>> = {
  never_called: "Jamais appelés",
  not_reached: "Sans réponse",
};

const INTEREST: Readonly<Record<InterestLevel, string>> = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

const TEAM_SIZES: Readonly<Record<ProspectTeamSize, string>> = {
  solo: "Seul",
  two_to_three: "2 à 3",
  four_plus: "4 et plus",
};

const TOOL_KINDS: Readonly<Record<ToolKind, string>> = {
  paper: "Papier",
  spreadsheet: "Tableur",
  software: "Logiciel",
};

const CERTIFICATE_VOLUMES: Readonly<Record<CertificateVolume, string>> = {
  under_300: "Moins de 300",
  from_300_to_800: "300 à 800",
  over_800: "Plus de 800",
};

const DECISION_MAKERS: Readonly<Record<DecisionMaker, string>> = {
  manager: "Gérant",
  partner: "Associé",
  other: "Autre",
};

export const callsFr = {
  outcomes: OUTCOMES,
  nextActions: NEXT_ACTIONS,
  notify: NOTIFY,
  taskKinds: TASK_KINDS,
  targets: TARGETS,
  myDay: {
    title: "Ma journée",
    start: "Commencer les appels",
    callsToday: "Appels du jour",
    callsTodayHint: "Depuis minuit",
    callbacks: "Rappels promis",
    nextAt: (time: string) => `Le prochain à ${time}`,
    noneLeft: "Aucun autre aujourd'hui",
    overdue: "En retard",
    overdueHint: (count: number) => (count === 0 ? "Rien en retard" : "À rappeler en premier"),
    demos: "Démos du jour",
    demosHint: (count: number) => (count === 0 ? "Aucune démo aujourd'hui" : "Préparez la fiche"),
    todo: "À faire maintenant",
    todoHint: "Le plus urgent en premier",
    late: "En retard",
    call: "Appeler",
    volumeLead: "Puis des appels en volume",
    volumeLeadHint: "Entreprises jamais appelées ou sans réponse",
    seeList: "Voir la liste",
    emptyTitle: "Rien de prévu aujourd'hui.",
    emptyText: "Lancez une série d'appels pour remplir votre journée.",
    emptyAction: "Lancer une série d'appels",
    unassigned: "À prendre",
    owner: (name: string) => `Suivi par ${name}`,
    taskLine: (contact: string | null, company: string, city: string | null) =>
      [contact, [company, city].filter(Boolean).join(", ")].filter(Boolean).join(" · "),
  },
  calls: {
    title: "Appels",
    subtitle: (count: number | null) =>
      count === null
        ? "Vos rappels et vos séries d'appels."
        : `${plural(count, "rappel", "rappels")} aujourd'hui, le plus urgent d'abord.`,
    dueTitle: "Rappels du jour",
    columns: { when: "Quand", contact: "Contact", owner: "Suivi par" },
    dueEmpty: "Aucun rappel aujourd'hui.",
    dueEmptyText: "Les rappels promis pendant vos appels s'affichent ici.",
    volumeTitle: "Appeler en volume",
    volumeHint: "Une série, un contact après l'autre.",
    size: "Nombre",
    sizeError: "Entre 5 et 30 appels.",
    zone: "Zone",
    anyZone: "Tous les départements",
    target: "Cible",
    launch: (size: number) => `Lancer la série de ${size}`,
    launchInvalid: "Lancer la série",
    volumeNote: "Les entreprises clientes ou pas intéressées ne sont jamais proposées.",
  },
  session: {
    title: "Série d'appels",
    single: "Appel",
    back: "Appels",
    close: "Terminer la série",
    due: (kind: string, when: string) => `${kind} : ${when}`,
    historyWhen: (when: string, author: string | null) =>
      author === null ? when : `${when} · ${author}`,
    historyWhat: (outcome: string, nextAction: string | null) =>
      nextAction === null ? outcome : `${outcome} · ${nextAction}`,
    position: (index: number, total: number) => `${index} sur ${total}`,
    mobilePosition: (index: number, total: number) => `Appel ${index} sur ${total}`,
    tally: (answered: number, voicemail: number) =>
      `${plural(answered, "joint", "joints")} · ${voicemail} messagerie`,
    skip: "Passer",
    finish: "Terminer",
    neverCalled: "Jamais appelé.",
    lastCall: (when: string, outcome: string) =>
      `Dernier appel : ${when.toLowerCase()}, ${outcome.toLowerCase()}.`,
    followedBy: (name: string) => `Suivi par ${name}.`,
    noPhone: "Pas de numéro",
    callNumber: (phone: string) => `Appeler le ${phone}`,
    history: "Historique",
    historyEmpty: "Aucun appel pour l'instant.",
    nextQuestion: "Prochaine question",
    questionsLeft: (count: number) =>
      count === 0
        ? "Qualification complète"
        : plural(count, "question restante", "questions restantes"),
    qualification: "Qualification",
    answered: (count: number) => `${plural(count, "réponse", "réponses")} sur 5`,
    showQualification: "Qualification complète",
    hideQualification: "Masquer la qualification",
    result: "Résultat",
    nextAction: "Prochaine action",
    date: "Date",
    time: "Heure",
    notification: "Notification",
    notes: "Notes",
    notesPlaceholder: "Ce qu'il faut retenir",
    required: "Choisissez une réponse.",
    choose: "Choisir",
    dateRequired: "Choisissez une date et une heure.",
    next: (name: string) => `Suivant : ${name}`,
    save: "Enregistrer",
    saveAndNext: "Enregistrer et suivant",
    saved: "Appel enregistré.",
    doneTitle: "Série terminée",
    doneText: (calls: number) => `${plural(calls, "appel noté", "appels notés")}.`,
    myDay: "Ma journée",
    newSeries: "Nouvelle série",
    emptyTitle: "Aucune entreprise à appeler.",
    emptyText: "Changez la zone ou la cible de la série.",
    emptyAction: "Changer la série",
  },
  qualification: {
    interest: { label: "Intérêt", options: INTEREST },
    teamSize: { label: "Effectif", options: TEAM_SIZES },
    toolKind: { label: "Outil actuel", options: TOOL_KINDS },
    certificateVolume: { label: "Certificats par an", options: CERTIFICATE_VOLUMES },
    decisionMaker: { label: "Décideur", options: DECISION_MAKERS },
  },
  questions: {
    interest: "« Est-ce que ça vous parle, de faire vos certificats sur téléphone ? »",
    teamSize: "« Vous êtes combien à faire des ramonages ? »",
    toolKind: "« Aujourd'hui, vos certificats, vous les faites sur papier ou sur un logiciel ? »",
    certificateVolume: "« Vous faites à peu près combien de certificats par an ? »",
    decisionMaker: "« C'est vous qui décidez pour ce genre d'outil ? »",
  },
} as const;
