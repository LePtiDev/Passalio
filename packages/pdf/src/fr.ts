import type { Energy, EquipmentKind, FLUE_TYPES, LegalForm } from "@passalio/trades";

type FlueType = (typeof FLUE_TYPES)[number];

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

export const pdfFr = {
  months: MONTHS,
  certificate: {
    title: "Certificat de ramonage",
    number: (number: string) => `N° ${number}`,
    legalBasis:
      "Attestation de ramonage établie en application de l'article R. 1331-75 du code de la santé publique.",
    visitedOn: "Visite",
    completedOn: "Opération achevée le",
    nextSweeping: "Prochain ramonage conseillé avant le",
    nextSweepingAfterRepair: "Après remise en état",
    customer: "Client",
    site: "Lieu de l'installation",
    equipment: "Appareil",
    flues: (count: number) => (count > 1 ? "Conduits" : "Conduit"),
    flueColumns: ["Conduit", "Appareil raccordé", "Résultat"] as const,
    observations: "Observations et recommandations",
    companyMessage: "Message de l'entreprise",
  },
  equipmentFields: {
    kind: "Type",
    energy: "Énergie",
    brandAndModel: "Marque et modèle",
    serialNumber: "N° de série",
    flueType: "Évacuation",
    lastSweepingOn: "Dernier ramonage",
    lastServiceOn: "Dernier entretien",
    unknown: "Non connu",
  },
  results: {
    full_length: "Vide sur toute sa longueur",
    partial: "Ramonage partiel",
    sealed_appliance: "Appareil étanche",
  },
  checks: {
    mechanical: "Ramonage par action mécanique directe sur la paroi intérieure du conduit.",
    vacuityStrong: "Vacuité du conduit attestée sur toute sa longueur",
    withConnectionPipe: ", tuyau de raccordement compris.",
    withoutConnectionPipe: ". Tuyau de raccordement non ramoné.",
    partialStrong: "Vacuité non attestée sur toute la longueur.",
    unsweptPart: (part: string) => ` Partie non ramonée : ${part}`,
    stacks: {
      good: "Souche et accessoires (mitre, aspirateur) vérifiés : en bon état.",
      needs_repair: "Souche et accessoires vérifiés : remise en état nécessaire.",
      not_checked: "Souche et accessoires : non vérifiés, accès impossible.",
    },
  },
  doNotUse: {
    title: "Utilisation du conduit déconseillée",
    body: "Nous vous recommandons de ne pas utiliser l'appareil avant la remise en état du conduit, puis de le faire ramoner à nouveau.",
  },
  signatures: {
    technician: "Ramonage effectué par",
    customer: "Pour le client",
    signedAt: (date: string, time: string) => `Signé le ${date} à ${time}`,
    customerAbsent: "Client absent lors du passage",
    customerAbsentNote: "Certificat remis sans signature du client.",
    technicianLabel: (name: string, qualification: string | null) =>
      qualification === null ? name : `${name} · ${qualification}`,
    technicianImage: (name: string) => `Signature de ${name}`,
  },
  footer: {
    page: (index: number, count: number) => `Page ${index} sur ${count}`,
    shareCapital: (euros: string) => `au capital de ${euros} €`,
    siren: (siren: string) => `SIREN ${siren}`,
    rcs: (city: string) => `RCS ${city}`,
    rne: "RNE",
    headOffice: (address: string) => `siège : ${address}`,
  },
  advicePage: {
    header: (number: string, date: string) => `Certificat de ramonage · N° ${number} · ${date}`,
    title: "Nos conseils pour votre appareil",
    intro:
      "Conseils remis en application de l'article R. 1331-77 du code de la santé publique et de l'annexe 2 de l'arrêté du 20 juillet 2023, conformes aux recommandations de l'ADEME. Les anomalies et non-conformités visibles relevées par le technicien figurent en page 1, rubrique « Observations ».",
    disclaimer:
      "Ces conseils sont donnés à titre indicatif. Ce ne sont pas des obligations : aucun investissement évoqué n'est imposé.",
    keepTitle: "À conserver",
    keepBody:
      "Conservez ce certificat au moins deux ans : il peut vous être demandé lors d'un contrôle. Votre assureur peut aussi vous le demander.",
  },
  legalForms: {
    ei: "EI",
    eurl: "EURL",
    sarl: "SARL",
    sasu: "SASU",
    sas: "SAS",
    sa: "SA",
    other: null,
  } satisfies Readonly<Record<LegalForm, string | null>>,
  equipmentKinds: {
    open_fireplace: "Cheminée ouverte",
    insert: "Insert",
    log_stove: "Poêle à bûches",
    pellet_stove: "Poêle à granulés",
    boiler: "Chaudière",
    solid_fuel_cooker: "Cuisinière",
    air_to_water_heat_pump: "PAC air/eau",
    air_to_air_heat_pump: "PAC air/air",
    air_conditioner: "Climatisation",
  } satisfies Readonly<Record<EquipmentKind, string>>,
  energies: {
    wood_logs: "Bois bûches",
    pellets: "Granulés",
    gas: "Gaz",
    oil: "Fioul",
    coal: "Charbon",
    electricity: "Électricité",
  } satisfies Readonly<Record<Energy, string>>,
  flueTypes: {
    masonry: "Conduit maçonné",
    lined_masonry: "Conduit maçonné tubé",
    metal: "Conduit métallique",
    sealed_concentric: "Ventouse",
  } satisfies Readonly<Record<FlueType, string>>,
} as const;
