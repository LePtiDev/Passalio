import type { Plan } from "@passalio/shared";
import type { InvoiceState, SubscriptionBadge } from "./subscription-view";

const days = (count: number) => (count === 1 ? "1 jour" : `${count} jours`);

const price = (euros: number) => `${euros} €`;

export const PLAN_NAMES: Readonly<Record<Plan, string>> = { solo: "Solo", team: "Équipe" };

export const billingFr = {
  title: "Abonnement",
  backToSettings: "Retour aux réglages",
  planLabel: {
    trial: "Essai gratuit",
    plan: (plan: Plan, isFounder: boolean) =>
      isFounder ? "Offre fondateur" : `Formule ${PLAN_NAMES[plan]}`,
  },
  intro: "Votre formule, vos paiements et vos factures. Prix hors taxes, sans engagement.",
  loading: "Chargement de l'abonnement",
  loadFailed: "Impossible de charger votre abonnement.",
  loadFailedText: "Vérifiez votre connexion, puis réessayez.",
  trial: {
    title: "Essai gratuit",
    daysLeft: (count: number) => (count === 0 ? "Dernier jour" : `Encore ${days(count)}`),
    until: (date: string) => `jusqu'au ${date}`,
    progressLabel: "Jours d'essai utilisés",
    text: "Aucune carte n'a été demandée. À la fin de l'essai, l'espace se bloque jusqu'au choix d'une formule. Vos données sont gardées.",
    mobileText: (date: string) =>
      `Jusqu'au ${date}. Ensuite, l'espace se bloque jusqu'au choix d'une formule.`,
  },
  billingDisabled: {
    title: "Le paiement en ligne arrive bientôt",
    text: "Votre espace reste ouvert en attendant. Vous pourrez choisir votre formule ici.",
  },
  interval: {
    label: "Période de paiement",
    month: "Mensuel",
    year: "Annuel",
    yearShort: "Annuel −2 mois",
    yearOffer: "Annuel : 2 mois offerts",
    yearWithOffer: "Annuel, 2 mois offerts",
  },
  plans: {
    recommended: "Conseillé",
    recommendedFor: (count: number) =>
      count <= 1
        ? "Conseillé : vous avez 1 technicien"
        : `Conseillé : vous avez ${count} techniciens`,
    perMonth: "HT par mois",
    perYear: "HT par an",
    perMonthShort: "HT/mois",
    perYearShort: "HT/an",
    price,
    description: {
      solo: "Un technicien qui signe les certificats. Bureau et secrétariat illimités.",
      team: "Techniciens illimités. Bureau et secrétariat illimités.",
    },
    shortDescription: {
      solo: "Un technicien. Bureau illimité.",
      team: "Techniciens illimités. Bureau illimité.",
    },
    choose: (plan: Plan) => `Choisir ${PLAN_NAMES[plan]}`,
    opening: "Ouverture de Stripe…",
  },
  included: {
    title: "Tout est inclus dans les deux formules",
    items: [
      "Certificats et clients illimités",
      "Fonctionne sans réseau",
      "Relances automatiques des clients",
      "Lecture de plaque par photo",
      "Planning de toute l'équipe",
    ],
  },
  paymentNote:
    "Paiement sécurisé par Stripe, par carte ou prélèvement SEPA. Vous changez de formule ou résiliez quand vous voulez. TVA non applicable, art. 293 B du CGI.",
  paymentNoteShort:
    "Carte ou prélèvement SEPA, sans engagement. TVA non applicable, art. 293 B du CGI.",
  subscribed: {
    title: (plan: Plan, isYearly: boolean, isFounder: boolean) =>
      `${isFounder ? "Offre fondateur" : PLAN_NAMES[plan]}, paiement ${isYearly ? "annuel" : "mensuel"}`,
    priceLine: (euros: number, isYearly: boolean) =>
      `${price(euros)} HT par ${isYearly ? "an" : "mois"}.`,
    planLine: (plan: Plan) =>
      plan === "solo"
        ? "Un technicien, bureau et secrétariat illimités."
        : "Techniciens illimités, bureau et secrétariat illimités.",
    badges: {
      active: "Active",
      payment_pending: "Paiement en cours",
      payment_failed: "Paiement refusé",
      ending: "Se termine bientôt",
    } satisfies Record<SubscriptionBadge, string>,
    endsOn: (date: string) => `Se termine le ${date}`,
    nextPayment: "Prochain paiement",
    nextPaymentValue: (date: string, amount: string) => `${date}, ${amount}`,
    accessUntil: "Accès garanti jusqu'au",
    endOfSubscription: "Fin de l'abonnement",
    paymentMethod: "Moyen de paiement",
    card: (last4: string | null) => (last4 === null ? "Carte" : `Carte •••• ${last4}`),
    sepa: (last4: string | null) =>
      last4 === null ? "Prélèvement SEPA" : `Prélèvement SEPA •••• ${last4}`,
    otherMethod: "Autre moyen de paiement",
    noMethod: "Aucun",
    technicians: "Techniciens",
    soloTechnicians: (count: number) => `${count} sur 1 inclus`,
    teamTechnicians: (count: number) => (count === 1 ? "1, sans limite" : `${count}, sans limite`),
    changePlan: "Changer de formule",
    managePayment: "Gérer le paiement",
    paymentAndInvoices: "Paiement et factures",
    mobileNote: "Les factures et la résiliation se gèrent dans l'espace de paiement Stripe.",
    cancelQuestion: "Vous voulez arrêter ?",
    cancel: "Résilier l'abonnement",
    cancelNote: "Vous gardez l'accès jusqu'à la fin de la période payée.",
    welcome: (plan: Plan) => `Bienvenue ! Votre formule ${PLAN_NAMES[plan]} est active.`,
    stripeFailed: "Impossible d'ouvrir Stripe. Réessayez.",
  },
  alerts: {
    member: {
      title: (ownerName: string | null) =>
        ownerName === null
          ? "Seul le propriétaire gère l'abonnement."
          : `Seul le propriétaire, ${ownerName}, gère l'abonnement.`,
      text: "Pour changer de formule ou de moyen de paiement, adressez-vous au propriétaire.",
    },
    payment_pending: {
      title: "Votre prélèvement SEPA est en cours de confirmation.",
      text: "Votre banque peut mettre jusqu'à 5 jours ouvrés. Vous avez accès à tout en attendant.",
    },
    payment_failed: {
      title: (amount: string, date: string) => `Le paiement de ${amount} du ${date} a été refusé.`,
      text: (date: string) =>
        `Mettez à jour votre moyen de paiement avant le ${date} pour garder l'accès. Nous réessayons automatiquement.`,
      action: "Mettre à jour le paiement",
    },
    cancel_scheduled: {
      title: (date: string) => `Votre abonnement s'arrête le ${date}.`,
      text: "Vous gardez tout jusque-là, puis l'espace se bloque. Vos données sont gardées.",
      action: "Reprendre l'abonnement",
    },
  },
  invoices: {
    title: "Factures",
    date: "Date",
    number: "Numéro",
    amount: "Montant",
    state: "État",
    noNumber: "En préparation",
    download: "PDF",
    downloadLabel: (number: string) => `PDF de la facture ${number}`,
    states: {
      paid: "Payée",
      processing: "En cours",
      unpaid: "Impayée",
      due: "À payer",
      void: "Annulée",
    } satisfies Record<InvoiceState, string>,
    empty: "Votre première facture apparaîtra ici après le premier paiement.",
    loadFailed: "Les factures n'ont pas pu être chargées.",
    stripeNote: "Toutes les factures sont aussi dans l'espace de paiement Stripe.",
  },
  banner: {
    trialEnding: (daysLeft: number) =>
      daysLeft === 0
        ? "Votre essai se termine aujourd'hui."
        : `Votre essai se termine dans ${days(daysLeft)}.`,
    trialText: "Choisissez une formule pour continuer sans interruption.",
    trialAction: "Choisir ma formule",
    paymentFailed: "Votre paiement a été refusé.",
    paymentFailedText: (date: string) =>
      `Mettez à jour votre moyen de paiement avant le ${date} pour garder l'accès.`,
    paymentFailedShortText: (date: string) =>
      `Mettez à jour votre moyen de paiement avant le ${date}`,
    paymentAction: "Mettre à jour le paiement",
  },
  blocked: {
    titles: {
      trial_ended: "Votre essai de 7 jours est terminé",
      unpaid: "Votre paiement n'a pas pu être fait",
      canceled: "Votre abonnement est arrêté",
    },
    ownerText:
      "Choisissez une formule pour retrouver votre espace. Rien n'est perdu : vos clients, vos passages et vos certificats vous attendent.",
    ownerShortText: "Choisissez une formule pour retrouver votre espace. Rien n'est perdu.",
    unpaidText:
      "Mettez à jour votre moyen de paiement pour retrouver votre espace. Rien n'est perdu : vos clients, vos passages et vos certificats vous attendent.",
    memberTitle: (organizationName: string | null) =>
      organizationName === null
        ? "L'espace de votre entreprise est en pause"
        : `L'espace de ${organizationName} est en pause`,
    memberText: (ownerName: string | null) =>
      `${ownerName === null ? "Le propriétaire" : `${ownerName}, le propriétaire,`} doit choisir une formule pour rouvrir l'espace. Prévenez-le. Les certificats déjà signés sur votre téléphone seront bien envoyés.`,
    dataTitle: "Vos données sont gardées",
    dataText: "Rien n'est supprimé pendant la pause.",
  },
} as const;
