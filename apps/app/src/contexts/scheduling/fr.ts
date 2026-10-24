import { DAY_MINUTES, type ServiceDocument, type TradeId } from "@passalio/trades";

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

const WHOLE_EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUROS_AND_CENTS = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export const formatEuros = (cents: number) =>
  (cents % 100 === 0 ? WHOLE_EUROS : EUROS_AND_CENTS).format(cents / 100);

export const formatDuration = (minutes: number) => {
  if (minutes >= DAY_MINUTES) {
    return plural(Math.floor(minutes / DAY_MINUTES), "jour", "jours");
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
};

export const VISIT_TYPE_LABELS: Readonly<Record<TradeId, string>> = {
  chimney_sweeping: "Ramonage",
  stove_maintenance: "Entretien de poêle",
  boiler_maintenance: "Entretien de chaudière",
  heat_pump_maintenance: "Entretien de pompe à chaleur",
  septic_tank_emptying: "Vidange de fosse",
};

export const visitTypesLabel = (types: readonly TradeId[]) =>
  types.map((type) => VISIT_TYPE_LABELS[type]).join(", ");

export const visitServicesLabel = ({
  serviceLines,
  visitTypes,
}: {
  readonly serviceLines: readonly { readonly name: string }[];
  readonly visitTypes: readonly TradeId[];
}) =>
  serviceLines.length === 0
    ? visitTypesLabel(visitTypes)
    : serviceLines.map(({ name }) => name).join(", ");

const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

type ServicePart = { readonly name: string };

const joinedParts = <Part extends ServicePart>(
  parts: readonly Part[],
  valueOf: (part: Part) => string,
) =>
  `${parts
    .map((part, index) => `${index === 0 ? part.name : lowerFirst(part.name)} ${valueOf(part)}`)
    .join(" + ")}.`;

export const SERVICE_DOCUMENT_LABELS: Readonly<Record<ServiceDocument, string>> = {
  chimney_sweeping_certificate: "Certificat de ramonage",
  maintenance_certificate: "Attestation d'entretien",
  none: "Aucun document",
};

export const formatServicePrice = (priceCents: number | null) =>
  priceCents === null ? "Sur devis" : formatEuros(priceCents);

export const schedulingFr = {
  planning: {
    title: "Planning",
    today: "Aujourd'hui",
    previous: "Période précédente",
    next: "Période suivante",
    day: "Jour",
    week: "Semaine",
    views: "Affichage",
    newVisit: "Nouveau passage",
    chooseMonth: "Choisir une date",
    visitCount: (count: number) =>
      count === 0 ? "Aucun passage" : plural(count, "passage", "passages"),
    daySummary: (count: number, cents: number) =>
      cents === 0
        ? plural(count, "passage", "passages")
        : `${plural(count, "passage", "passages")} · ${formatEuros(cents)}`,
    weekRange: (first: number, last: number | string) => `Semaine du ${first} au ${last}`,
    teamSummary: (technicians: number, visits: number) =>
      `${plural(technicians, "technicien", "techniciens")} · ${plural(visits, "passage", "passages")}`,
    noVisit: "Aucun passage",
    untimed: "Sans heure",
    more: (count: number) => `+${count}`,
    moreVisits: (count: number) =>
      `${plural(count, "autre passage", "autres passages")}, voir la journée`,
    signed: "Terminé",
    toSend: "À envoyer",
    loadingLabel: "Chargement du planning",
    gridLabel: (label: string) => `Passages du ${label}`,
    now: "Heure actuelle",
    hour: (hour: number) => `${hour} h`,
    timeRange: (start: string, end: string) => `${start} – ${end}`,
    emptyTitle: "Aucun passage ce jour",
    emptyWeekTitle: "Aucun passage cette semaine",
    emptyText: "Ajoutez vos rendez-vous. Sur place, le certificat se remplit depuis le passage.",
    emptyTechnicianText: "Votre responsable ajoute vos rendez-vous. Ils apparaîtront ici.",
    errorMessage: "Impossible de récupérer le planning. Vérifiez votre connexion puis réessayez.",
    offline: "Hors ligne.",
    offlineText: (pending: number) =>
      pending === 0
        ? "Vous pouvez consulter et ajouter des passages. Ils partiront au retour du réseau."
        : `Vous pouvez continuer. ${plural(pending, "modification partira", "modifications partiront")} au retour du réseau.`,
  },
  team: {
    wholeTeam: "Toute l'équipe",
    technicianCount: (count: number) => plural(count, "technicien", "techniciens"),
    pickerTitle: "Agendas affichés",
    showAll: "Tout afficher",
    search: "Rechercher un technicien",
    noMatch: "Aucun technicien ne correspond.",
    apply: (count: number) =>
      count === 0 ? "Choisissez un agenda" : `Afficher ${plural(count, "agenda", "agendas")}`,
    openPicker: (count: number) => `Agendas affichés : ${count}`,
    progress: (done: number, total: number) => `${done}/${total}`,
    progressLabel: (done: number, total: number) => `${done} sur ${total} terminés`,
    current: "En ce moment",
    finished: "Journée terminée",
    noVisit: "Aucun passage",
  },
  panel: {
    title: "Passage",
    open: "Ouvrir le passage",
    route: "Itinéraire",
    announced: (price: string) => `${price} annoncés`,
    close: "Fermer",
  },
  visit: {
    back: "Retour au planning",
    title: (time: string | null) => (time === null ? "Passage" : `Passage de ${time}`),
    status: {
      planned: "Prévu",
      now: "En cours",
      completed: "Terminé",
      cancelled: "Annulé",
    },
    call: "Appeler",
    route: "Itinéraire",
    customerFile: "Fiche",
    openCustomer: "Fiche client",
    equipmentsTitle: "Appareils de ce passage",
    noEquipment: "Aucun appareil choisi pour ce passage.",
    toFill: "À remplir",
    note: "Note :",
    placeTitle: "Lieu et client",
    address: "Adresse",
    access: "Accès",
    phone: "Téléphone",
    email: "Email",
    announcedPrice: "Prix annoncé",
    technician: "Technicien",
    technicians: "Techniciens",
    visitType: "Prestations",
    typeAndDuration: (types: string, duration: string) => `${types} · ${duration}`,
    fillCertificate: "Remplir le certificat",
    soon: "Bientôt",
    subtitle: (day: string, technician: string, equipments: number) =>
      `${day} · ${technician} · ${plural(equipments, "appareil", "appareils")}`,
    actions: "Actions sur le passage",
    cancel: "Annuler le passage",
    cancelTitle: "Annuler ce passage ?",
    cancelText: "Il disparaîtra du planning. Le client et ses appareils restent dans la fiche.",
    confirmCancel: "Annuler le passage",
    keep: "Garder",
    cancelled: "Passage annulé.",
    cancelFailed: "Le passage n'a pas pu être annulé. Réessayez.",
    notFoundTitle: "Ce passage n'existe plus",
    notFoundText: "Il a peut-être été annulé. Revenez au planning.",
  },
  form: {
    title: "Nouveau passage",
    note: "Le passage apparaît sur le téléphone de chaque technicien, même sans réseau.",
    submit: "Ajouter au planning",
    customerSection: "Le client",
    customer: "Client",
    customerPlaceholder: "Nom du client",
    customerMatches: "Clients trouvés",
    newCustomer: "Nouveau client",
    noCustomerMatch: (query: string) => `Aucun client pour « ${query} »`,
    changeCustomer: "Changer de client",
    appointmentSection: "Le rendez-vous",
    date: "Date",
    time: "Heure",
    duration: "Durée",
    technician: "Techniciens",
    technicianHint: "Ajoutez un deuxième technicien si le passage se fait à deux.",
    technicianPlaceholder: "Choisir les techniciens",
    confirm: "Valider",
    removeTechnician: (name: string) => `Retirer ${name}`,
    equipmentsSection: "Les appareils",
    site: "Lieu",
    noEquipment: "Ce lieu n'a pas encore d'appareil. Vous pourrez l'ajouter sur place.",
    lastSweeping: (date: string) => `Ramonage · dernier le ${date}`,
    lastSweepingOverdue: (date: string) => `Ramonage · dernier le ${date}, en retard`,
    neverSwept: "Ramonage · aucun passage enregistré",
    price: "Prix annoncé",
    priceHint: "Repris sur le passage et au moment du paiement.",
    notes: "Note pour le technicien",
    notesPlaceholder: "Ex. : prévoir le débistrage",
    created: "Passage ajouté au planning.",
    required: "obligatoire",
    services: "Prestations",
    servicesHint: "Choisies d'après les appareils du client.",
    servicesConfirm: (duration: string, price: string | null) =>
      price === null ? `Valider · ${duration}` : `Valider · ${duration} · ${price}`,
    servicesPlaceholder: "Choisir les prestations",
    servicesCount: (count: number) => `${count} prestations choisies`,
    durationHint: (parts: readonly { name: string; durationMinutes: number }[]) => {
      const [only] = parts;
      if (only === undefined) {
        return "Choisissez la durée prévue.";
      }
      return parts.length === 1
        ? `Durée habituelle : ${formatDuration(only.durationMinutes)}. Vous pouvez la changer.`
        : joinedParts(parts, ({ durationMinutes }) => formatDuration(durationMinutes));
    },
    durationChanged: (usual: number) =>
      `Modifiée pour ce passage. Habituellement ${formatDuration(usual)}.`,
    durationReset: (usual: number) => `Remettre ${formatDuration(usual)}`,
    priceFromServices: (parts: readonly { name: string; priceCents: number | null }[]) =>
      `${joinedParts(parts, ({ priceCents }) => formatServicePrice(priceCents).toLowerCase())} Vous pouvez le changer.`,
    errors: {
      services: "Choisissez au moins une prestation.",
      customer: "Choisissez le client.",
      site: "Choisissez le lieu.",
      date: "Indiquez la date.",
      time: "Indiquez l'heure.",
      technician: "Choisissez au moins un technicien.",
      price: "Indiquez un prix valide, par exemple 75.",
      saveFailed: "Le passage n'a pas pu être enregistré sur ce téléphone.",
    },
  },
  services: {
    title: "Prestations",
    subtitle: "Durées et prix par défaut",
    backToSettings: "Retour aux réglages",
    settings: "Réglages",
    intro:
      "Choisies sur un passage, elles remplissent la durée et le prix annoncé. On peut toujours les changer pour un passage.",
    footnote:
      "Le document remis décide du certificat ou de l'attestation à remplir sur place. Une prestation de plus d'une journée se planifie en plusieurs jours.",
    add: "Nouvelle prestation",
    columns: {
      name: "Prestation",
      duration: "Durée",
      price: "Prix TTC",
      document: "Document remis",
    },
    summary: (duration: string, price: string, document: string) =>
      `${duration} · ${price} · ${document}`,
    open: (name: string) => `Modifier ${name}`,
    createTitle: "Nouvelle prestation",
    editTitle: "Modifier la prestation",
    name: "Nom",
    namePlaceholder: "Ex. : Ramonage de conduit",
    duration: "Durée",
    price: "Prix TTC",
    priceHint: "Vide si sur devis.",
    document: "Document remis",
    documentHint: "À remplir sur place à la fin du passage.",
    keepsPlanned: "Les passages déjà prévus gardent leur durée et leur prix.",
    archive: "Retirer",
    save: "Enregistrer",
    created: "Prestation ajoutée.",
    saved: "Prestation enregistrée. Elle s'applique aux prochains passages.",
    archived: "Prestation retirée. Les passages déjà prévus la gardent.",
    saveFailed: "La prestation n'a pas pu être enregistrée. Réessayez.",
    archiveFailed: "La prestation n'a pas pu être retirée. Réessayez.",
    loadFailed: "Impossible de récupérer les prestations. Vérifiez votre connexion puis réessayez.",
    loading: "Chargement des prestations",
    emptyTitle: "Aucune prestation",
    emptyText:
      "Ajoutez ce que vous faites chez vos clients, avec sa durée et son prix. Elles rempliront vos passages.",
    addDefaults: "Ajouter les prestations de vos métiers",
    defaultsAdded: "Prestations ajoutées. Vous pouvez régler leurs durées et leurs prix.",
    readOnly: "Seuls le gérant et les administrateurs modifient les prestations.",
    errors: {
      name: "Indiquez le nom de la prestation.",
      price: "Indiquez un prix valide, par exemple 75.",
    },
  },
} as const;
