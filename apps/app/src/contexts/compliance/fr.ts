import type { SweepingExtent } from "@passalio/trades";
import type { AnomalyKind, ChimneyStackState, FormExtent } from "./certificate-form";

export const ANOMALY_LABELS: Readonly<Record<AnomalyKind, string>> = {
  soot: "Bistre ou goudron",
  leak: "Défaut d'étanchéité",
  damaged_flue: "Conduit dégradé",
  accessory: "Accessoire à remettre en état",
  other: "Autre",
};

export const STACK_LABELS: Readonly<Record<ChimneyStackState, string>> = {
  good: "Bon état",
  needs_repair: "À reprendre",
  not_checked: "Non vérifiés",
};

export const EXTENT_LABELS: Readonly<Record<FormExtent, string>> = {
  full_length: "Toute la longueur",
  partial: "Ramonage partiel",
};

const EXTENT_SUMMARIES: Readonly<Record<SweepingExtent, string>> = {
  full_length: "Vacuité sur toute la longueur",
  partial: "Ramonage partiel",
  sealed_appliance: "Appareil étanche",
};

export const complianceFr = {
  entry: {
    fill: "Remplir le certificat",
    view: "Voir les certificats",
  },
  form: {
    title: "Certificat de ramonage",
    planning: "Planning",
    trail: "Certificat",
    subtitle: (parts: readonly string[]) => parts.join(" · "),
    step: (current: number, total: number) => `Étape ${current} sur ${total}`,
    back: "Retour au passage",
    editEquipment: "Modifier",
    flueSection: "Le conduit ramoné",
    flue: "Conduit",
    fluePlaceholder: "Ex. : conduit maçonné tubé, salon",
    flueHint: "Repris de la fiche de l'appareil.",
    connectionPipe: "Tuyau de raccordement ramoné aussi",
    mechanical: "Ramonage mécanique sur la paroi intérieure",
    mechanicalHint: "Hérisson ou équivalent. Obligatoire pour délivrer le certificat.",
    resultSection: "Le résultat",
    resultText: "Vacuité du conduit.",
    fullLengthNote: "Le certificat attestera la vacuité du conduit sur toute sa longueur.",
    unsweptPart: "Partie non accessible",
    unsweptPartPlaceholder: "Ex. : coude dans les combles",
    partialWarning:
      "Le certificat n'attestera pas la vacuité sur toute la longueur. Il indiquera la partie non ramonée et l'accès à rétablir.",
    stacksSection: "Souches et accessoires",
    stacksText: "Mitre, mitron, aspirateur.",
    anomaliesSection: "Anomalies",
    anomaliesText: "Elles figurent sur le certificat.",
    anomalyDetails: "Précision",
    anomalyDetailsPlaceholder: "Ex. : bistre sur 2 m, débistrage conseillé",
    doNotUse: "Utilisation du conduit déconseillée",
    doNotUseText:
      "À cocher si le conduit est dangereux. Le client et le certificat le verront en premier.",
    datesSection: "Dates",
    visitedOn: "Visite",
    lastSweepingOn: "Dernier ramonage",
    lastServiceOn: "Dernier entretien",
    continue: "Continuer",
    cancel: "Annuler",
    note: "Rien n'est envoyé avant la signature.",
    saveFailed: "Le brouillon n'a pas pu être gardé sur ce téléphone. Réessayez.",
    errors: {
      flue: "Indiquez le conduit ramoné.",
      mechanical: "Le certificat demande un ramonage mécanique de la paroi intérieure.",
      unsweptPart: "Précisez la partie du conduit non accessible.",
      anomalyDetails: "Précisez l'anomalie.",
      visitedOn: "Indiquez la date de la visite.",
      futureDate: "La date ne peut pas être dans le futur.",
      afterVisit: "La date doit précéder la visite.",
    },
  },
  sealed: {
    title: "Pas de certificat de ramonage pour cet appareil",
    text: "Un appareil étanche à ventouse ne se ramone pas : il relève de l'attestation d'entretien, bientôt disponible.",
  },
  alreadySigned: {
    title: "Certificat déjà signé",
    text: "Un certificat signé ne se modifie plus.",
    open: "Voir le certificat",
  },
  notFound: {
    title: "Appareil introuvable",
    text: "Cet appareil ne fait pas partie du passage, ou le passage a été annulé.",
    back: "Retour au planning",
  },
  sign: {
    title: "Signer le certificat",
    trail: "Signature",
    stepTitle: "Récapitulatif et signatures",
    certificates: "Certificats",
    certificatesText: "Un certificat par appareil.",
    edit: "Modifier",
    toFill: "À remplir",
    fill: "Remplir",
    extent: (extent: SweepingExtent) => EXTENT_SUMMARIES[extent],
    doNotUse: "Utilisation déconseillée",
    summary: (parts: readonly string[]) => parts.join(" · "),
    savedSignature: (name: string) => `${name} · signature enregistrée`,
    read: "Lire",
    adviceTitle: "Conseils d'utilisation",
    close: "Fermer",
    signing: "Signature en cours…",
    advice: "Conseils d'utilisation joints",
    adviceText:
      "Obligatoires pour un appareil à combustible solide. Texte officiel, repris mot pour mot.",
    signatures: "Signatures",
    technician: "Technicien",
    customer: "Client",
    redo: "Refaire",
    clear: "Effacer",
    signHere: "Signez ici avec le doigt",
    technicianPad: (name: string) => `Signature du technicien, ${name}`,
    customerPad: (name: string) => `Signature du client, ${name}`,
    customerAbsent: "Client absent",
    customerAbsentText: "Le certificat sera remis sans la signature du client.",
    submit: "Signer le certificat",
    submitMany: (count: number) => `Signer les ${count} certificats`,
    note: "Une fois signé, le certificat ne peut plus être modifié.",
    errors: {
      technicianSignature: "Signez en tant que technicien.",
      customerSignature: "Faites signer le client ou cochez « Client absent ».",
      missingCertificates: "Remplissez le certificat de chaque appareil avant de signer.",
    },
    failures: {
      issuer_missing:
        "Les réglages de l'entreprise ne sont pas encore sur ce téléphone. Ouvrez l'application une fois avec du réseau.",
      legal_mentions_missing:
        "Il manque des informations légales de l'entreprise. Elles figurent sur chaque certificat.",
      no_number_available:
        "Ce téléphone n'a plus de numéro de certificat réservé. Connectez-vous au réseau un instant.",
      invalid: "Le certificat est incomplet. Vérifiez chaque appareil.",
    },
  },
  legal: {
    title: "Avant votre premier certificat",
    text: "Ces informations figurent sur chaque certificat. Vous les donnez une seule fois.",
    submit: "Enregistrer et signer",
    later: "Plus tard",
    waiting: "Enregistré. Préparation du certificat sur ce téléphone…",
    waitFailed:
      "Les informations sont enregistrées mais pas encore arrivées sur ce téléphone. Signez à nouveau dans un instant.",
    technicianTitle: "Informations de l'entreprise incomplètes",
    technicianText: "Les informations de l'entreprise sont incomplètes. Prévenez votre gérant.",
    understood: "J'ai compris",
  },
  signed: {
    toast: "Certificat signé.",
    toastMany: (count: number) => `${count} certificats signés.`,
    title: "Certificat signé",
    titleMany: (count: number) => `${count} certificats signés`,
    subtitle: (number: string, customer: string, at: string) =>
      `N° ${number} · ${customer} · ${at}. Il ne peut plus être modifié.`,
    fileName: (number: string) => `certificat-ramonage-${number}.pdf`,
    pages: (count: number) => (count === 1 ? "1 page" : `${count} pages`),
    withAdvice: "certificat et conseils d'utilisation",
    alone: "certificat",
    pending: "En attente d'envoi au serveur",
    synced: "Enregistré sur le serveur",
    share: "Partager",
    view: "Voir le PDF",
    download: "Télécharger",
    pdfFailed: "Le PDF n'a pas pu être préparé sur ce téléphone.",
    shareUnavailable: "Le partage n'est pas disponible sur cet appareil. Téléchargez le PDF.",
    nextDuePrefix: "Prochain ramonage conseillé avant le",
    backToVisit: "Retour au passage",
    nextVisit: "Passage suivant",
    goToNext: "Y aller",
    trail: "Signé",
    subtitleMany: (customer: string, at: string) =>
      `${customer} · ${at}. Ils ne peuvent plus être modifiés.`,
  },
} as const;
