export const toolsFr = {
  serverInstructions:
    "Outils de l'espace admin Passalio. Lecture : vue d'ensemble, comptes clients, journal, prospection. Écriture (si autorisée) : entreprises prospectées, contacts, étapes et notes. Aucune suppression. Chaque écriture est journalisée au nom de la personne connectée.",
  fields: {
    cursor: "Curseur de la page suivante, renvoyé par l'appel précédent (nextCursor).",
    limit: "Nombre de lignes par page, de 5 à 50.",
    search: "Recherche par début de nom.",
    accountId: "Identifiant du compte client (entreprise cliente).",
    companyId: "Identifiant de l'entreprise prospectée.",
    contactId: "Identifiant du contact.",
    department: "Numéro de département, par exemple 94.",
    stage: "Étape de prospection.",
    owner: "Identifiant de la personne de l'équipe qui suit l'entreprise.",
    accountFilter: "all : tous, trial : en essai, dropping : utilisation en baisse.",
    contactFilter: "all : tous, leaders : dirigeants, no_phone : sans téléphone.",
    note: "Note ajoutée à l'historique de l'entreprise.",
    noteBody: "Texte de la note.",
    noteContactId: "Contact concerné par la note, facultatif.",
    changes: "Champs à modifier, seulement ceux qui changent.",
    contact: "Champs du contact.",
  },
  tools: {
    get_overview: {
      title: "Vue d'ensemble",
      description: "Chiffres de la plateforme : comptes, essais, utilisation, comptes en baisse.",
    },
    list_accounts: {
      title: "Comptes clients",
      description: "Liste paginée des entreprises clientes, avec filtre et recherche.",
    },
    get_account: {
      title: "Fiche d'un compte client",
      description:
        "Fiche d'une entreprise cliente : informations, personnel et utilisation par mois.",
    },
    list_journal: {
      title: "Journal",
      description:
        "Journal paginé. Sans accountId : journal de la plateforme. Avec accountId : journal du compte client.",
    },
    get_prospect_filters: {
      title: "Filtres de prospection",
      description:
        "Départements présents et personnes de l'équipe qui peuvent suivre une entreprise.",
    },
    list_prospect_companies: {
      title: "Entreprises prospectées",
      description: "Liste paginée des entreprises prospectées, avec le nombre par étape.",
    },
    get_prospect_company: {
      title: "Fiche entreprise prospectée",
      description: "Fiche d'une entreprise prospectée avec ses contacts et son historique.",
    },
    list_prospect_contacts: {
      title: "Contacts prospectés",
      description: "Liste paginée des contacts des entreprises prospectées.",
    },
    get_prospect_contact: {
      title: "Fiche contact",
      description: "Fiche d'un contact avec son entreprise et son historique.",
    },
    create_prospect_company: {
      title: "Créer une entreprise prospectée",
      description: "Crée une entreprise prospectée, à l'étape « à qualifier ».",
    },
    update_prospect_company: {
      title: "Modifier une entreprise prospectée",
      description: "Modifie les champs donnés d'une entreprise prospectée.",
    },
    change_prospect_stage: {
      title: "Changer l'étape",
      description: "Change l'étape d'une entreprise prospectée, avec une note facultative.",
    },
    add_prospect_note: {
      title: "Ajouter une note",
      description: "Ajoute une note à l'historique d'une entreprise prospectée.",
    },
    add_prospect_contact: {
      title: "Ajouter un contact",
      description: "Ajoute un contact à une entreprise prospectée.",
    },
    update_prospect_contact: {
      title: "Modifier un contact",
      description: "Modifie les champs donnés d'un contact.",
    },
  },
} as const;

export type McpToolName = keyof typeof toolsFr.tools;
