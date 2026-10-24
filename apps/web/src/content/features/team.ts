import type { MarketingPageInput } from "../content-schema";

export const teamPage: MarketingPageInput = {
  slug: "equipe-et-roles",
  isPublished: true,
  seo: {
    title: "Équipe et rôles pour ramoneurs | Passalio",
    description:
      "Invitez vos techniciens et votre secrétariat, chacun avec son rôle. L’accès est coupé quand quelqu’un part, l’historique reste.",
  },
  menu: {
    title: "Équipe et rôles",
    text: "Chacun son rôle, toute l’équipe.",
    icon: "users",
  },
  eyebrow: "Produit · Équipe et rôles",
  title: "Chacun voit ce qu’il doit voir. Toute l’équipe au même prix.",
  lead: "Invitez vos techniciens et votre secrétariat. Chacun a son rôle : le secrétariat organise, les techniciens font leurs passages. Avec la formule Équipe, le nombre de techniciens n’est pas limité.",
  highlights: ["Techniciens illimités", "Quatre rôles, chacun ses droits", "Invitation par mail"],
  screen: {
    backLabel: "Réglages",
    status: {
      label: "4 personnes",
      tone: "neutral",
    },
    title: "Équipe",
    subtitle: "Ramonage Martin",
    rows: [
      {
        label: "Julien Martin",
        value: "Propriétaire",
        tag: "Actif",
      },
      {
        label: "Sophie Martin",
        value: "Secrétariat",
        tag: "Actif",
      },
      {
        label: "Karim Haddad",
        value: "Technicien",
        tag: "Actif",
      },
      {
        label: "Léa Roux",
        value: "Technicienne · invitée",
      },
    ],
    action: "Inviter une personne",
  },
  pains: [
    {
      title: "Le prix au compte",
      text: "Un technicien de plus, un abonnement de plus.",
    },
    {
      title: "Le mot de passe partagé",
      text: "Tout le monde se connecte avec le même compte.",
    },
    {
      title: "Le départ",
      text: "Un salarié part, il a encore accès à tous les clients.",
    },
  ],
  featuresTitle: "Une équipe organisée, sans compter les comptes.",
  features: [
    {
      label: "Invitations",
      title: "Un mail, et la personne est dans l’équipe",
      text: "Vous saisissez l’email et le rôle. La personne reçoit une invitation, crée son mot de passe, et commence.",
      bullets: [
        "Invitation par mail",
        "Rôle choisi à l’invitation",
        "Invitation renvoyée ou annulée en un geste",
      ],
      visual: {
        title: "Invitation envoyée",
        subtitle: "lea.roux@email.fr",
        status: {
          label: "En attente",
          tone: "warning",
        },
        rows: [
          {
            label: "Rôle",
            value: "Technicienne",
          },
          {
            label: "Envoyée",
            value: "Le 14 oct. à 18 h 02",
          },
          {
            label: "Valable",
            value: "7 jours",
          },
        ],
      },
    },
    {
      label: "Rôles",
      title: "Le secrétariat organise, le terrain fait ses passages",
      text: "Chaque rôle a ses droits. Un technicien voit ses passages et ses clients. Le secrétariat gère le planning, l’administrateur gère l’équipe.",
      bullets: [
        "Propriétaire, administrateur, secrétariat, technicien",
        "Droits vérifiés à chaque action",
        "Changement de rôle immédiat",
      ],
      visual: {
        title: "Ce que voit un technicien",
        subtitle: "Karim Haddad",
        status: {
          label: "Technicien",
          tone: "neutral",
        },
        rows: [
          {
            label: "Ses passages",
            value: "Oui",
          },
          {
            label: "Fiches de ses clients",
            value: "Oui",
          },
          {
            label: "Gestion de l’équipe",
            value: "Non",
          },
        ],
      },
    },
    {
      label: "Départs",
      title: "Quelqu’un part, son accès part avec lui",
      text: "Vous retirez la personne de l’équipe. Elle n’a plus accès à rien. Ses passages et ses documents restent dans l’entreprise.",
      bullets: [
        "Accès coupé tout de suite",
        "Historique gardé",
        "Passages à venir confiés à un autre",
      ],
      visual: {
        title: "Retirer de l’équipe",
        subtitle: "Thomas Petit",
        status: {
          label: "Accès coupé",
          tone: "validated",
        },
        rows: [
          {
            label: "Accès",
            value: "Retiré le 14 oct.",
            tag: "Fait",
          },
          {
            label: "Passages passés",
            value: "214 · gardés",
          },
          {
            label: "Passages à venir",
            value: "6 · confiés à Karim",
          },
        ],
      },
    },
  ],
  questions: [
    {
      question: "Combien coûte un technicien de plus ?",
      answer: "Rien avec la formule Équipe : les techniciens y sont illimités.",
    },
    {
      question: "Que voit un technicien ?",
      answer:
        "Ses passages et les fiches de ses clients. La gestion de l’équipe reste à l’administrateur.",
    },
  ],
  finalTitle: "Invitez votre équipe sur Passalio.",
};
