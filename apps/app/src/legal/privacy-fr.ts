import type { LegalDocument } from "./legal-document";
import { PUBLISHER } from "./legal-fr";

export const PRIVACY_FR: LegalDocument = {
  title: "Politique de confidentialité",
  sections: [
    {
      id: "responsable",
      title: "Qui est responsable",
      blocks: [
        {
          kind: "paragraph",
          text: `L'éditeur de Passalio (voir les mentions légales) est responsable des données de votre compte, de votre abonnement et de nos échanges. Contact : ${PUBLISHER.email}.`,
        },
        {
          kind: "paragraph",
          text: "Pour les fiches de vos propres clients, c'est votre entreprise qui est responsable. Nous sommes son sous-traitant (voir l'annexe des conditions). Un particulier qui veut exercer ses droits sur sa fiche s'adresse d'abord à l'entreprise qui l'a créée.",
        },
      ],
    },
    {
      id: "collecte",
      title: "Ce que nous collectons et pourquoi",
      shortTitle: "Ce que nous collectons",
      blocks: [
        {
          kind: "table",
          headers: ["Données", "Pourquoi", "Base légale", "Conservation"],
          rows: [
            [
              "Prénom, nom, email, mot de passe chiffré, rôle, date d'acceptation des conditions",
              "Créer et sécuriser votre compte",
              "Contrat",
              "Durée du compte, puis 90 jours",
            ],
            [
              "Entreprise : nom, SIRET, adresse, logo, métiers, numéros d'agrément",
              "Configurer votre espace et vos documents",
              "Contrat",
              "Durée du compte, puis 90 jours",
            ],
            [
              "Abonnement : formule, factures, moyen de paiement (géré par Stripe)",
              "Facturer",
              "Contrat et obligation légale",
              "Factures : 10 ans (article L. 123-22 du Code de commerce)",
            ],
            [
              "Adresse IP, date et appareil de connexion, tentatives de connexion",
              "Protéger les comptes, bloquer les abus",
              "Intérêt légitime",
              "12 mois",
            ],
            [
              "Journal des actions sensibles (rôles, exports, suppressions)",
              "Tracer et pouvoir enquêter en cas d'incident",
              "Intérêt légitime",
              "12 mois",
            ],
            [
              "Rapports d'erreur techniques, sans donnée personnelle",
              "Corriger les bugs",
              "Intérêt légitime",
              "90 jours",
            ],
            [
              "Pages vues et clics, sans contenu saisi",
              "Comprendre l'usage et améliorer Passalio",
              "Consentement",
              "12 mois",
            ],
            [
              "Emails échangés avec nous",
              "Répondre à vos questions",
              "Intérêt légitime",
              "3 ans après le dernier échange",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "Nous ne vendons aucune donnée. Nous n'utilisons pas les données de vos clients pour notre propre compte, ni pour entraîner un modèle d'intelligence artificielle.",
        },
      ],
    },
    {
      id: "destinataires",
      title: "Qui y a accès",
      blocks: [
        {
          kind: "paragraph",
          text: "L'équipe Passalio, au strict besoin, et ces prestataires :",
        },
        {
          kind: "table",
          headers: ["Prestataire", "Rôle", "Lieu des données"],
          rows: [
            [
              "Cloudflare",
              "Hébergement, base de données, fichiers, protection anti-robot",
              "Union européenne",
            ],
            ["Resend", "Envoi des emails", "Union européenne (Irlande)"],
            ["Stripe", "Paiement de l'abonnement", "Irlande (Union européenne)"],
            ["Sentry", "Rapports d'erreur", "Union européenne"],
            ["PostHog", "Mesure d'usage", "Union européenne"],
          ],
        },
        {
          kind: "paragraph",
          text: "Ces prestataires sont pour la plupart des sociétés américaines. Un accès depuis les États-Unis reste possible, par exemple pour leur support. Il est encadré par le cadre de protection des données UE–États-Unis ou par des clauses contractuelles types de la Commission européenne.",
        },
        {
          kind: "paragraph",
          text: "Nous pouvons aussi transmettre des données à une autorité qui les demande légalement.",
        },
      ],
    },
    {
      id: "recherche-entreprise",
      title: "Recherche d'entreprise",
      blocks: [
        {
          kind: "paragraph",
          text: "Quand vous cherchez votre entreprise à l'inscription, seul le texte saisi est envoyé à l'annuaire public des entreprises de l'État (recherche-entreprises.api.gouv.fr).",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      blocks: [
        {
          kind: "list",
          items: [
            "Un cookie de session vous garde connecté. Il est indispensable et ne demande pas d'accord.",
            "La protection anti-robot de Cloudflare (Turnstile) vérifie que vous n'êtes pas un robot, sans suivi publicitaire.",
            "La mesure d'usage ne démarre qu'avec votre accord, que vous pouvez retirer à tout moment.",
            "Aucun cookie publicitaire.",
          ],
        },
      ],
    },
    {
      id: "securite",
      title: "Sécurité",
      blocks: [
        {
          kind: "paragraph",
          text: "Données chiffrées en transit et au repos, séparation stricte entre entreprises, mots de passe hachés, sauvegardes chiffrées hors de notre hébergeur. En cas de violation de vos données, nous prévenons la CNIL sous 72 heures et vous informons si le risque est élevé.",
        },
      ],
    },
    {
      id: "droits",
      title: "Vos droits",
      blocks: [
        {
          kind: "paragraph",
          text: "Vous pouvez accéder à vos données, les corriger, les effacer, les récupérer dans un format lisible, limiter ou refuser un traitement fondé sur l'intérêt légitime, et donner des directives pour après votre décès.",
        },
        {
          kind: "paragraph",
          text: `Pour les exercer, écrivez à ${PUBLISHER.email}. Nous répondons sous un mois.`,
        },
        {
          kind: "paragraph",
          text: "Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).",
        },
      ],
    },
    {
      id: "changements",
      title: "Changements",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous vous prévenons par email et dans l'application de tout changement important de cette politique.",
        },
      ],
    },
  ],
};
