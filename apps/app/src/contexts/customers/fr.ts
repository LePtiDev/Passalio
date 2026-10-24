import type {
  BuildingType,
  Civility,
  Energy,
  EquipmentKind,
  EquipmentPhotoKind,
} from "@passalio/shared";
import type { FLUE_TYPES } from "@passalio/trades";

type FlueType = (typeof FLUE_TYPES)[number];

const plural = (count: number, one: string, many: string) => `${count} ${count <= 1 ? one : many}`;

export const EQUIPMENT_KIND_LABELS: Readonly<Record<EquipmentKind, string>> = {
  open_fireplace: "Cheminée ouverte",
  insert: "Insert",
  log_stove: "Poêle à bûches",
  pellet_stove: "Poêle à granulés",
  boiler: "Chaudière",
  solid_fuel_cooker: "Cuisinière",
  air_to_water_heat_pump: "PAC air/eau",
  air_to_air_heat_pump: "PAC air/air",
  air_conditioner: "Climatisation",
};

const FEMININE_KINDS: ReadonlySet<EquipmentKind> = new Set([
  "open_fireplace",
  "boiler",
  "solid_fuel_cooker",
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
]);

const agreed = (kind: EquipmentKind, word: string) =>
  FEMININE_KINDS.has(kind) ? `${word}e` : word;

const capitalized = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const KINDS_WITH_ARTICLE: Readonly<Record<EquipmentKind, string>> = {
  open_fireplace: "la cheminée",
  insert: "l'insert",
  log_stove: "le poêle à bûches",
  pellet_stove: "le poêle à granulés",
  boiler: "la chaudière",
  solid_fuel_cooker: "la cuisinière",
  air_to_water_heat_pump: "la pompe à chaleur",
  air_to_air_heat_pump: "la pompe à chaleur",
  air_conditioner: "la climatisation",
};

export const ENERGY_LABELS: Readonly<Record<Energy, string>> = {
  wood_logs: "Bûches",
  pellets: "Granulés",
  gas: "Gaz",
  oil: "Fioul",
  coal: "Charbon",
  electricity: "Électricité",
};

export const ENERGY_ADJECTIVES: Readonly<Record<Energy, string>> = {
  wood_logs: "bois",
  pellets: "granulés",
  gas: "gaz",
  oil: "fioul",
  coal: "charbon",
  electricity: "électrique",
};

export const FLUE_TYPE_LABELS: Readonly<Record<FlueType, string>> = {
  masonry: "Maçonné",
  lined_masonry: "Maçonné tubé",
  metal: "Métallique",
  sealed_concentric: "Ventouse",
};

export const BUILDING_TYPE_LABELS: Readonly<Record<BuildingType, string>> = {
  house: "Maison",
  apartment: "Appartement",
  business: "Local pro",
};

const BUILDING_TYPES_WITH_ARTICLE: Readonly<Record<BuildingType, string>> = {
  house: "la maison",
  apartment: "l'appartement",
  business: "le local pro",
};

export const CIVILITY_LABELS: Readonly<Record<Civility, string>> = {
  mrs: "Madame",
  mr: "Monsieur",
};

export const PHOTO_KIND_LABELS: Readonly<Record<EquipmentPhotoKind, string>> = {
  plate: "Plaque signalétique",
  overview: "Appareil",
};

const KINDS_NAMED_WITH_ENERGY: ReadonlySet<EquipmentKind> = new Set(["insert", "boiler"]);

export const customersFr = {
  sync: {
    upToDate: "À jour",
    syncing: "Synchronisation…",
    offline: (pending: number) =>
      pending === 0 ? "Hors ligne" : `Hors ligne · ${pending} à envoyer`,
    pending: (pending: number) => `${pending} à envoyer`,
    error: "Synchronisation en échec",
    neverSynced: "Pas encore synchronisé",
    offlineTitle: "Vous êtes hors ligne",
    offlineText: (pending: number) =>
      pending === 0
        ? "Vous pouvez continuer. Vos modifications seront envoyées dès le retour du réseau."
        : `Vous pouvez continuer. ${plural(pending, "modification sera envoyée", "modifications seront envoyées")} dès le retour du réseau.`,
    rejected: (count: number) =>
      `${plural(count, "modification refusée", "modifications refusées")} par le serveur.`,
    rejectedShort: (count: number) => plural(count, "refusée", "refusées"),
    pendingBadge: "À envoyer",
  },
  list: {
    title: "Clients",
    subtitle: (customers: number, equipments: number) =>
      `${plural(customers, "client", "clients")}, ${plural(equipments, "appareil suivi", "appareils suivis")}. Disponibles même sans réseau.`,
    emptySubtitle: "Vos clients, leurs lieux et leurs appareils. Disponibles même sans réseau.",
    errorSubtitle: "Vos clients, leurs lieux et leurs appareils.",
    customerCount: (customers: number) =>
      customers === 0 ? "Aucun client" : plural(customers, "client", "clients"),
    loading: "Chargement…",
    newCustomer: "Nouveau client",
    searchLabel: "Rechercher un client",
    searchPlaceholder: "Nom, ville, téléphone…",
    filters: { all: "Tous", near: "Échéance proche", overdue: "En retard" },
    mobileFilters: { all: "Tous", near: "Proches", overdue: "En retard" },
    columns: {
      customer: "Client",
      address: "Adresse",
      equipments: "Appareils",
      nextDue: "Prochaine échéance",
    },
    equipmentCount: (count: number) => plural(count, "appareil", "appareils"),
    noEquipment: "Aucun appareil",
    dueUnknown: "À définir",
    overdue: "En retard · ",
    contact: (name: string, phone: string | null) =>
      phone === null ? `Contact : ${name}` : `Contact : ${name} · ${phone}`,
    emptyTitle: "Ajoutez votre premier client",
    emptyText:
      "Un client, l'adresse de l'installation, puis ses appareils. Ses attestations et ses relances partiront de là.",
    import: "Importer un fichier",
    searchEmptyTitle: (query: string) => `Aucun client pour « ${query} »`,
    searchEmptyText: "Vérifiez l'orthographe, ou cherchez par ville ou par téléphone.",
    createFromSearch: (query: string) => `Créer le client « ${query} »`,
    clearSearch: "Effacer la recherche",
    filterEmptyTitle: {
      near: "Aucun client avec une échéance proche",
      overdue: "Aucun client en retard",
    },
    filterEmptyText: "Les autres clients restent dans la liste complète.",
    showAll: "Voir tous les clients",
    loadError: "Impossible de récupérer vos clients. Vérifiez votre connexion puis réessayez.",
  },
  form: {
    optional: "· facultatif",
    cancel: "Annuler",
    close: "Fermer",
    customerTitle: "Nouveau client",
    editCustomerTitle: "Modifier le client",
    customerSection: "Le client",
    customerSectionText:
      "La personne ou la société qui commande l'intervention et reçoit l'attestation.",
    kinds: { individual: "Particulier", company: "Professionnel" },
    civility: "Civilité",
    civilityUnknown: "Non précisé",
    firstName: "Prénom",
    firstNamePlaceholder: "Martine",
    lastName: "Nom",
    companyName: "Raison sociale",
    contactName: "Contact sur place",
    phone: "Téléphone",
    email: "Email",
    emailPlaceholder: "martine@exemple.fr",
    emailHint: "Pour envoyer l'attestation et les relances.",
    addressSection: "L'adresse de l'installation",
    addressSectionText: "Là où se trouvent les appareils.",
    siteTitle: "Nouveau lieu",
    siteNote: "Un autre logement ou local du même client.",
    siteLabel: "Nom du lieu",
    siteLabelPlaceholder: "Ex. : Appartement loué",
    address: "Adresse",
    addressSource: "Adresses de la Base Adresse Nationale.",
    manualEntry: "Saisir à la main",
    postalCode: "Code postal",
    city: "Ville",
    addressDetails: "Complément",
    addressDetailsPlaceholder: "Bâtiment, étage, porte",
    buildingType: "Type de logement",
    accessNotes: "Accès",
    accessNotesPlaceholder: "Digicode, clés, animaux…",
    occupantName: "Occupant",
    occupantPhone: "Téléphone de l'occupant",
    differentBilling: "L'adresse de facturation est différente",
    billingSection: "Adresse de facturation",
    billingAddress: "Adresse de facturation",
    notes: "Notes",
    notesPlaceholder: "Préférences, règlement…",
    saveCustomer: "Enregistrer le client",
    saveChanges: "Enregistrer",
    saveSite: "Ajouter le lieu",
    customerNote: "Vous ajouterez les appareils juste après.",
    editNote: "Les modifications sont enregistrées sur ce téléphone.",
    errors: {
      lastName: "Indiquez le nom du client.",
      companyName: "Indiquez la raison sociale.",
      phone: "Ce numéro est incomplet.",
      email: "Saisissez une adresse email valide.",
      address: "Indiquez l'adresse.",
      postalCode: "Le code postal compte 5 chiffres.",
      city: "Indiquez la ville.",
      year: "Saisissez une année sur 4 chiffres.",
      date: "Saisissez une date valide.",
      number: "Saisissez un nombre.",
      kind: "Choisissez le type d'appareil.",
      refrigerant: "Exemple attendu : R32 ou R410A.",
      saveFailed: "L'enregistrement a échoué sur ce téléphone.",
    },
  },
  equipmentForm: {
    title: "Nouvel appareil",
    photos: "Photos",
    photosText: "La photo de la plaque remplit la marque, le modèle et le numéro de série.",
    removePhoto: "Retirer la photo",
    photoProblems: {
      wrong_type: "Ce fichier n'est pas une photo. Choisissez une photo JPEG, PNG ou WebP.",
      too_large: "Cette photo dépasse 5 Mo. Choisissez une photo plus légère.",
    },
    section: "L'appareil",
    kind: "Type d'appareil",
    kindGroups: {
      flue: "Ramonage et entretien",
      heatPump: "Pompe à chaleur et climatisation",
    },
    kindHint:
      "Seuls les métiers de votre entreprise sont proposés. Les champs s'adaptent au type choisi.",
    energy: "Combustible",
    brand: "Marque",
    model: "Modèle",
    serialNumber: "Numéro de série",
    serialNumberPlaceholder: "Sur la plaque signalétique",
    room: "Pièce",
    power: "Puissance",
    powerUnit: "kW",
    flueSection: "Le conduit",
    flueType: "Type de conduit",
    flueTypePlaceholder: "Choisir",
    flueLocation: "Repère",
    flueLocationPlaceholder: "Ex. : souche côté rue",
    refrigerant: "Fluide frigorigène",
    refrigerantCharge: "Charge",
    refrigerantChargeUnit: "kg",
    outdoorUnit: "Unité extérieure",
    indoorUnit: "Unité intérieure",
    installation: "Installation",
    alreadyInPlace: "Déjà en place",
    installedByUs: "Installé par nous",
    installationYear: "Année d'installation",
    installationYearPlaceholder: "Ex. : 2019",
    commissionedOn: "Date de mise en service",
    replaces: "Remplace",
    replacesNothing: "Aucun appareil",
    replacesHint: "L'ancien appareil passe dans l'historique avec ses attestations.",
    lastVisit: "Le dernier passage",
    lastVisitText: "Si vous le connaissez, l'échéance se calcule toute seule.",
    lastSweeping: "Dernier ramonage",
    lastService: "Dernier entretien",
    save: "Ajouter l'appareil",
    note: "Les champs facultatifs pourront être complétés sur place.",
    replaceNote: "Le nouvel appareil remplace l'ancien, qui reste dans l'historique.",
    replaceNoteOf: (kind: EquipmentKind, replaced: EquipmentKind) =>
      `${capitalized(KINDS_WITH_ARTICLE[kind])} remplace ${KINDS_WITH_ARTICLE[replaced]}, qui reste dans l'historique.`,
  },
  file: {
    customerSince: (date: string, isFeminine: boolean) =>
      `${isFeminine ? "Cliente" : "Client"} depuis le ${date}`,
    customerSinceToday: (isFeminine: boolean) =>
      `${isFeminine ? "Cliente" : "Client"} depuis aujourd'hui`,
    summary: (equipments: number, sites: number) =>
      sites <= 1
        ? `${plural(equipments, "appareil", "appareils")} en service`
        : `${plural(equipments, "appareil", "appareils")} sur ${plural(sites, "lieu", "lieux")}`,
    call: "Appeler",
    edit: "Modifier",
    schedule: "Planifier",
    route: "Itinéraire",
    email: "Email",
    more: "Plus d'actions",
    archive: "Archiver le client",
    archiveTitle: (name: string) => `Archiver ${name} ?`,
    archiveText:
      "Le client, ses lieux et ses appareils disparaissent de la liste, pour toute l'équipe. Ses attestations signées sont conservées.",
    archiveConfirm: "Archiver",
    archived: "Client archivé.",
    sites: "Lieux et appareils",
    addSite: "Ajouter un lieu",
    occupant: (value: string) => `Occupant : ${value}`,
    noEquipmentTitle: "Aucun appareil sur ce lieu",
    noEquipmentText:
      "Ajoutez l'insert, le poêle ou la chaudière à entretenir. L'échéance se calcule toute seule.",
    addEquipment: "Ajouter un appareil",
    removedEquipments: (count: number) => `Appareils retirés (${count})`,
    removedOn: (kind: EquipmentKind, date: string) => `${agreed(kind, "retiré")} le ${date}`,
    replacedBy: (kind: EquipmentKind, replacement: EquipmentKind) =>
      `${agreed(kind, "remplacé")} par ${KINDS_WITH_ARTICLE[replacement]}`,
    installedByUsOn: (kind: EquipmentKind, date: string) =>
      `${agreed(kind, "Installé")} par nous le ${date}`,
    serial: (value: string) => `n° ${value}`,
    nextDue: (date: string) => `Prochaine échéance le ${date}`,
    nextActivity: {
      chimney_sweeping: (date: string) => `Prochain ramonage le ${date}`,
      maintenance: (date: string) => `Prochain entretien le ${date}`,
    },
    activityOverdue: {
      chimney_sweeping: (date: string) => `Ramonage en retard depuis le ${date}`,
      maintenance: (date: string) => `Entretien en retard depuis le ${date}`,
    },
    dueUnknown: "Échéance à définir",
    photo: "Photo de l'appareil",
    overdueSince: (date: string) => `En retard depuis le ${date}`,
    equipmentActions: "Actions sur l'appareil",
    siteActions: "Actions sur le lieu",
    replace: "Remplacer",
    remove: "Retirer",
    removed: "Appareil retiré. Il reste dans l'historique.",
    removeTitle: (name: string) => `Retirer ${name} ?`,
    removeText:
      "L'appareil passe dans l'historique avec ses attestations. Il ne sera plus relancé.",
    removeConfirm: "Retirer",
    removeFailed: "Le retrait a échoué sur ce téléphone.",
    archiveFailed: "L'archivage a échoué sur ce téléphone.",
    confirmCancel: "Annuler",
    contact: "Coordonnées",
    phone: "Téléphone",
    billing: "Facturation",
    billingSameAsBuilding: (buildingType: BuildingType) =>
      `Identique à ${BUILDING_TYPES_WITH_ARTICLE[buildingType]}`,
    billingSameAsSite: (label: string) => `Identique à « ${label} »`,
    reminders: "Relances",
    remindersByEmail: "Par email, un mois avant l'échéance",
    remindersNeedEmail: "Ajoutez un email pour les relances",
    remindersOff: "Le client ne veut pas de relance",
    notSet: "Non renseigné",
    notes: "Notes",
    history: "Historique",
    historyEmptyTitle: "Aucune attestation pour l'instant",
    historyEmptyText:
      "Les interventions et les attestations signées de ce client apparaîtront ici.",
    notFoundTitle: "Ce client n'existe pas ou a été archivé",
    notFoundText: "Revenez à la liste pour retrouver vos clients.",
    backToList: "Retour aux clients",
  },
  toasts: {
    customerCreated: "Client ajouté. Il est enregistré sur ce téléphone.",
    customerUpdated: "Client modifié.",
    siteCreated: "Lieu ajouté.",
    equipmentCreated: "Appareil ajouté.",
    equipmentReplaced: "Appareil remplacé. L'ancien reste dans l'historique.",
  },
  kindBadge: { individual: "Particulier", company: "Professionnel" },
  equipmentName: (kind: EquipmentKind, energy: Energy | null) =>
    energy !== null && KINDS_NAMED_WITH_ENERGY.has(kind)
      ? `${EQUIPMENT_KIND_LABELS[kind]} ${ENERGY_ADJECTIVES[energy]}`
      : EQUIPMENT_KIND_LABELS[kind],
  tradeTags: { chimney_sweeping: "Ramonage", maintenance: "Entretien", heat_pump: "PAC" },
};
