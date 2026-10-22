import type { LegalSection } from "./legal-document";
import { PUBLISHER } from "./legal-fr";

export const TERMS_CLAUSE_SECTIONS: readonly LegalSection[] = [
  {
    id: "usage-loyal",
    title: "10. Usage loyal",
    blocks: [
      { kind: "paragraph", text: "Vous vous engagez à ne pas :" },
      {
        kind: "list",
        items: [
          "utiliser Passalio pour une activité illégale ou des documents mensongers ;",
          "envoyer des messages à des personnes qui ne sont pas vos clients ou qui s'y sont opposées ;",
          "tenter d'accéder aux données d'une autre entreprise, de contourner les limites techniques, de copier ou de décompiler le logiciel ;",
          "revendre ou mettre à disposition de tiers l'accès à votre espace.",
        ],
      },
    ],
  },
  {
    id: "vos-donnees",
    title: "11. Vos données, export et suppression",
    shortTitle: "11. Vos données",
    blocks: [
      {
        kind: "list",
        items: [
          "Les Données du Client vous appartiennent. Nous ne les utilisons que pour vous fournir le service.",
          "Vous pouvez exporter vos fiches clients et vos attestations (CSV et PDF) à tout moment, sans frais.",
          "Après la fin de l'abonnement ou de l'essai, vos données restent exportables pendant 90 jours. Elles sont ensuite supprimées, sauf les informations que la loi nous oblige à garder (factures). Les sauvegardes chiffrées sont effacées au plus tard 30 jours après.",
          "Les durées légales de conservation des attestations auprès de vos clients vous incombent. Pensez à exporter vos attestations avant la suppression.",
        ],
      },
    ],
  },
  {
    id: "donnees-personnelles",
    title: "12. Données personnelles",
    blocks: [
      {
        kind: "paragraph",
        text: "Pour les données de vos propres clients, vous êtes responsable du traitement et nous sommes votre sous-traitant. L'accord de sous-traitance en annexe fait partie de ces conditions. Pour les données de votre compte, voir la politique de confidentialité.",
      },
    ],
  },
  {
    id: "propriete-intellectuelle",
    title: "13. Propriété intellectuelle",
    blocks: [
      {
        kind: "paragraph",
        text: "Le logiciel, la marque Passalio, les modèles et la documentation appartiennent à l'éditeur. Vous recevez un droit d'utilisation personnel, non exclusif et non transférable, pour la durée de l'abonnement.",
      },
      {
        kind: "paragraph",
        text: "Vous nous autorisez à utiliser votre nom et votre logo dans votre espace et sur les documents que vous générez. Nous ne les citons comme référence commerciale qu'avec votre accord.",
      },
    ],
  },
  {
    id: "responsabilite",
    title: "14. Responsabilité",
    blocks: [
      {
        kind: "list",
        items: [
          "Nous répondons des dommages directs causés par un manquement prouvé à nos obligations.",
          "Nous ne répondons pas des dommages indirects : perte de chiffre d'affaires, de clientèle ou d'image.",
          "Notre responsabilité totale est limitée aux sommes que vous avez payées pendant les 12 mois précédant le fait générateur.",
          "Ces limites ne s'appliquent pas en cas de faute lourde ou intentionnelle, ni aux dommages corporels.",
        ],
      },
    ],
  },
  {
    id: "force-majeure",
    title: "15. Force majeure",
    blocks: [
      {
        kind: "paragraph",
        text: "Aucune partie n'est responsable d'un retard ou d'un manquement dû à un cas de force majeure au sens de l'article 1218 du Code civil.",
      },
    ],
  },
  {
    id: "confidentialite",
    title: "16. Confidentialité",
    blocks: [
      {
        kind: "paragraph",
        text: "Chaque partie garde confidentielles les informations non publiques de l'autre, pendant le contrat et 2 ans après.",
      },
    ],
  },
  {
    id: "modification",
    title: "17. Modification des conditions",
    blocks: [
      {
        kind: "paragraph",
        text: "Nous pouvons modifier ces conditions. Une modification importante vous est annoncée par email et dans l'application au moins 30 jours avant son entrée en vigueur. Si vous la refusez, vous pouvez résilier sans frais avant cette date.",
      },
    ],
  },
  {
    id: "droit-applicable",
    title: "18. Droit applicable et litiges",
    blocks: [
      {
        kind: "paragraph",
        text: `Ces conditions sont soumises au droit français. En cas de désaccord, écrivez-nous d'abord : nous cherchons une solution amiable sous 30 jours. À défaut, le litige est porté devant les tribunaux du ressort de ${PUBLISHER.courtCity}, sauf règle impérative contraire.`,
      },
    ],
  },
];
