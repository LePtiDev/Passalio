import type { LegalSection } from "./legal-document";
import { PUBLISHER } from "./legal-fr";

export const TERMS_SERVICE_SECTIONS: readonly LegalSection[] = [
  {
    id: "objet",
    title: "1. Objet",
    blocks: [
      {
        kind: "paragraph",
        text: "Ces conditions régissent l'utilisation de Passalio, un logiciel en ligne pour les professionnels de l'entretien obligatoire : fiches clients, attestations signées sur place, envoi au client et relances. Elles forment le contrat entre l'éditeur (voir les mentions légales) et l'entreprise qui crée un espace (« le Client »).",
      },
      {
        kind: "paragraph",
        text: "Passalio est réservé aux professionnels. En créant un compte, vous déclarez agir pour les besoins de votre activité professionnelle et avoir le pouvoir d'engager votre entreprise.",
      },
    ],
  },
  {
    id: "definitions",
    title: "2. Définitions",
    blocks: [
      {
        kind: "definitions",
        items: [
          { term: "Client", text: "l'entreprise abonnée, représentée par son patron." },
          {
            term: "Utilisateur",
            text: "toute personne qui accède à l'espace du Client (patron, technicien, secrétariat).",
          },
          {
            term: "Données du Client",
            text: "tout ce que le Client et ses utilisateurs saisissent, dont les fiches de leurs propres clients et les attestations.",
          },
          {
            term: "Particulier",
            text: "le client final du Client, propriétaire ou occupant d'un logement.",
          },
        ],
      },
    ],
  },
  {
    id: "compte",
    title: "3. Compte et accès",
    blocks: [
      {
        kind: "list",
        items: [
          "Vous fournissez des informations exactes et les tenez à jour.",
          "Chaque utilisateur a son propre compte. Les identifiants sont personnels et confidentiels.",
          "Le patron invite les utilisateurs, choisit leur rôle et peut retirer un accès à tout moment. Le Client répond des actions faites avec les comptes de son espace.",
          "Prévenez-nous sans délai si vous pensez qu'un compte est compromis.",
        ],
      },
    ],
  },
  {
    id: "service",
    title: "4. Le service",
    blocks: [
      {
        kind: "list",
        items: [
          "Passalio est accessible en ligne et, pour les écrans de terrain, hors ligne avec synchronisation au retour du réseau.",
          "Nous faisons nos meilleurs efforts pour que le service soit disponible et sûr (obligation de moyens). Des interruptions peuvent avoir lieu pour maintenance, si possible annoncées à l'avance.",
          "Le service évolue. Nous pouvons ajouter, modifier ou retirer des fonctions, sans retirer une fonction essentielle sans préavis de 30 jours.",
          "Vous avez besoin d'un appareil récent avec un navigateur à jour et d'un accès à Internet pour synchroniser.",
        ],
      },
    ],
  },
  {
    id: "attestations",
    title: "5. Vos attestations restent sous votre responsabilité",
    shortTitle: "5. Vos attestations",
    blocks: [
      {
        kind: "paragraph",
        text: "Passalio propose des modèles construits à partir des textes officiels. Les informations pré-remplies, y compris par intelligence artificielle, sont des propositions à vérifier.",
      },
      {
        kind: "notice",
        text: "En signant une attestation, vous certifiez l'intervention et son contenu. Vous restez seul responsable de l'exactitude des informations, de la conformité de votre intervention et du respect des règles de votre métier. Une attestation signée ne peut plus être modifiée.",
      },
    ],
  },
  {
    id: "essai",
    title: "6. Essai gratuit",
    blocks: [
      {
        kind: "paragraph",
        text: "Vous pouvez essayer Passalio gratuitement pendant 7 jours, sans moyen de paiement. À la fin de l'essai, que l'espace soit configuré ou non, il est bloqué jusqu'à la souscription d'un abonnement : vous pouvez seulement souscrire, exporter vos données et vous déconnecter. Vos données sont conservées selon l'article 11.",
      },
    ],
  },
  {
    id: "prix",
    title: "7. Prix et paiement",
    blocks: [
      {
        kind: "list",
        items: [
          `Formule Solo, pour un technicien : 29 € par mois ou 290 € par an. Formule Équipe, techniciens illimités : 49 € par mois ou 490 € par an. Prix ${PUBLISHER.priceTaxBasis}.`,
          "Un technicien est une personne qui réalise les passages et signe les certificats. Les autres utilisateurs de l'espace du Client sont illimités dans les deux formules.",
          "Le passage de la formule Solo à la formule Équipe prend effet immédiatement. Le prix est ajusté au prorata de la période en cours.",
          "Le paiement se fait d'avance, par carte ou prélèvement, via notre prestataire de paiement Stripe. Nous ne conservons pas vos numéros de carte.",
          "Une facture est disponible à chaque paiement.",
          "Nous pouvons changer les prix. Le nouveau prix vous est annoncé par email au moins 30 jours avant le renouvellement suivant. Si vous le refusez, vous pouvez résilier avant cette date.",
        ],
      },
    ],
  },
  {
    id: "retard-paiement",
    title: "8. Retard de paiement",
    blocks: [
      {
        kind: "paragraph",
        text: "En cas d'échec de paiement, nous vous prévenons par email et réessayons. Sans régularisation sous 15 jours, l'espace passe en lecture seule. Vos données restent consultables et exportables.",
      },
      {
        kind: "paragraph",
        text: "Conformément à l'article L. 441-10 du Code de commerce, toute somme impayée à l'échéance porte intérêt au taux de la Banque centrale européenne majoré de 10 points, et donne lieu à une indemnité forfaitaire de 40 € pour frais de recouvrement.",
      },
    ],
  },
  {
    id: "duree",
    title: "9. Durée et résiliation",
    blocks: [
      {
        kind: "list",
        items: [
          "L'abonnement est sans engagement au-delà de la période payée. Il se renouvelle automatiquement pour la même durée.",
          "Vous pouvez résilier à tout moment depuis les réglages. La résiliation prend effet à la fin de la période en cours. La période commencée n'est pas remboursée.",
          "Nous pouvons suspendre ou résilier un espace en cas de manquement grave à ces conditions (article 10), après une mise en demeure restée sans effet pendant 15 jours, ou immédiatement si la sécurité du service ou de tiers est en jeu.",
          "Si nous arrêtons Passalio, nous vous prévenons au moins 90 jours à l'avance et remboursons la part non utilisée d'un abonnement annuel.",
        ],
      },
    ],
  },
];
