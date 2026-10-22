import type { LegalSection } from "./legal-document";

export const DATA_PROCESSING_SECTION: LegalSection = {
  id: "annexe-sous-traitance",
  title: "Annexe : accord de sous-traitance (article 28 du RGPD)",
  shortTitle: "Annexe : sous-traitance RGPD",
  blocks: [
    {
      kind: "paragraph",
      text: "Le Client est responsable du traitement des données de ses propres clients. L'éditeur de Passalio les traite pour son compte, comme sous-traitant.",
    },
    {
      kind: "table",
      headers: ["Point", "Contenu"],
      rows: [
        [
          "Objet",
          "Héberger et traiter les données nécessaires au service : fiches clients, lieux, équipements, interventions, attestations, photos, envoi des documents et relances",
        ],
        ["Durée", "Celle de l'abonnement, plus le délai de suppression de l'article 11"],
        [
          "Personnes concernées",
          "Clients et contacts du Client (particuliers, syndics, bailleurs), utilisateurs de son espace",
        ],
        [
          "Données",
          "Identité, coordonnées, adresse du logement, équipements, dates et comptes rendus d'intervention, signatures, photos. Aucune donnée sensible n'est demandée",
        ],
      ],
    },
    { kind: "paragraph", text: "Nos engagements :" },
    {
      kind: "orderedList",
      items: [
        "Ne traiter les données que sur vos instructions, qui sont ces conditions et vos actions dans Passalio. Vous prévenir si une instruction nous semble contraire au RGPD.",
        "Soumettre toute personne qui y accède à une obligation de confidentialité.",
        "Protéger les données (article 32) : chiffrement en transit et au repos, séparation stricte entre entreprises, accès limité et journalisé, sauvegardes chiffrées hors ligne.",
        "Ne faire appel qu'aux sous-traitants ultérieurs listés dans la politique de confidentialité, liés par les mêmes obligations. Vous prévenir 30 jours avant tout ajout ou remplacement ; vous pouvez vous y opposer en résiliant.",
        "Garder les données dans l'Union européenne. Si un prestataire y accède depuis un pays tiers, l'encadrer par une décision d'adéquation ou des clauses contractuelles types.",
        "Vous aider à répondre aux demandes des personnes (accès, rectification, effacement, opposition). Une demande reçue par erreur vous est transmise sans y répondre.",
        "Vous notifier toute violation de données dans les meilleurs délais et au plus tard 48 heures après l'avoir constatée, avec les informations utiles à votre propre notification à la CNIL.",
        "Vous aider pour une analyse d'impact si elle est nécessaire.",
        "À la fin du contrat, rendre les données par l'export puis les supprimer (article 11).",
        "Tenir à votre disposition les informations prouvant le respect de cet accord, et permettre un audit raisonnable, à vos frais, avec un préavis de 30 jours.",
      ],
    },
    {
      kind: "paragraph",
      text: "Vos engagements : disposer d'une base légale pour les données que vous saisissez, informer vos clients (par exemple sur vos devis ou attestations), et ne saisir que les données utiles.",
    },
  ],
};
