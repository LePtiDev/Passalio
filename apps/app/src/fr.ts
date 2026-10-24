export const fr = {
  app: {
    name: "Passalio",
    tagline: "Chaque passage, en règle.",
    signOut: "Se déconnecter",
  },
  shell: {
    mainNavigation: "Navigation principale",
    dashboard: "Tableau de bord",
    home: "Accueil",
    schedule: "Planning",
    customers: "Clients",
    documents: "Attestations",
    reminders: "Relances",
    settings: "Réglages",
    team: "Équipe",
    visitTypes: "Types de passage",
    company: "Entreprise",
    subscription: "Abonnement",
    soon: "Bientôt",
    breadcrumb: "Fil d'Ariane",
  },
  home: {
    greeting: (firstName: string) => (firstName === "" ? "Bonjour" : `Bonjour ${firstName}`),
    subtitle: "Encore quelques étapes pour remettre votre première attestation.",
    ready: "Votre espace est prêt.",
    readyWithInvitations: (count: number) =>
      count === 1
        ? "Votre espace est prêt. 1 invitation envoyée à votre équipe."
        : `Votre espace est prêt. ${count} invitations envoyées à votre équipe.`,
    gettingStarted: "Premiers pas",
    progress: (done: number, total: number) => `${done} sur ${total}`,
    progressLabel: (done: number, total: number) => `${done} étapes sur ${total} terminées`,
    tasks: {
      company: {
        title: "Créer votre entreprise",
        text: "Nom, métiers et documents configurés.",
      },
      team: {
        title: "Inviter votre équipe",
        todoText: "Vos techniciens et votre secrétariat reçoivent un lien par email.",
        doneText: (count: number) =>
          count <= 1
            ? "Votre équipe est invitée."
            : `${count} personnes dans l'équipe ou invitées.`,
        action: "Inviter",
      },
      customers: {
        title: "Ajouter vos clients",
        text: "Importez un fichier Excel ou CSV, ou ajoutez-les un par un.",
      },
      schedule: {
        title: "Planifier une intervention",
        text: "Placez-la dans la tournée d'un technicien.",
      },
      document: {
        title: "Remplir votre première attestation",
        text: "Sur le téléphone, signée sur place.",
      },
      reminders: {
        title: "Activer les relances",
        text: "Vos clients sont prévenus avant leur prochain passage.",
      },
    },
    trialTitle: "Essai gratuit en cours",
    trialText: "Puis 29,99 € par mois, utilisateurs illimités, sans engagement.",
  },
  pagination: {
    label: "Pagination",
    range: (first: number, last: number, total: number | null) =>
      total === null ? `${first}–${last}` : `${first}–${last} sur ${total}`,
    page: (page: number, pages: number) => `Page ${page} sur ${pages}`,
    previous: "Page précédente",
    next: "Page suivante",
  },
  dialog: {
    close: "Fermer",
  },
  settings: {
    title: "Réglages",
    signedInAs: "Connecté en tant que",
  },
  errors: {
    code: (shortTraceId: string) => `Code : ${shortTraceId}`,
    retry: "Réessayer",
    messages: {
      internal: "Une erreur est survenue. Réessayez dans un instant.",
      network: "Pas de connexion. Vérifiez votre réseau puis réessayez.",
      invalid_response: "Réponse inattendue du serveur. Réessayez dans un instant.",
      invalid_request: "Certaines informations sont invalides. Vérifiez le formulaire.",
      rate_limited: "Trop de tentatives. Patientez une minute puis réessayez.",
      unauthenticated: "Votre session a expiré. Reconnectez-vous.",
      forbidden: "Vous n'avez pas les droits pour cette action.",
      no_active_organization: "Choisissez d'abord une entreprise.",
      impersonation_read_only: "Mode consultation : aucune modification n'est possible.",
      invalid_organization_name: "Le nom doit faire entre 2 et 100 caractères.",
      organization_not_found: "Entreprise introuvable.",
      member_not_found: "Ce membre n'existe plus.",
      already_member: "Cette personne fait déjà partie de l'équipe.",
      owner_role_not_assignable:
        "Le rôle de propriétaire ne s'attribue pas. Utilisez le transfert.",
      owner_cannot_be_changed: "Le propriétaire ne peut pas être modifié ni retiré.",
      transfer_target_not_admin: "La propriété se transfère uniquement à un administrateur.",
      invitation_not_found: "Cette invitation n'existe plus ou a déjà été utilisée.",
      invitation_expired: "Cette invitation a expiré. Demandez-en une nouvelle.",
      invalid_credentials: "Adresse email ou mot de passe incorrect.",
      email_already_used: "Un compte existe déjà avec cette adresse. Connectez-vous.",
      weak_password: "Le mot de passe doit faire au moins 12 caractères.",
      invalid_reset_token: "Ce lien n'est plus valable. Demandez-en un nouveau.",
      captcha_failed: "La vérification anti-robot a échoué. Réessayez.",
      invalid_two_factor_code: "Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.",
      two_factor_expired: "La vérification a expiré. Reconnectez-vous.",
      two_factor_too_many_attempts: "Trop d'essais. Reconnectez-vous dans quelques minutes.",
      invalid_password: "Mot de passe incorrect.",
      terms_outdated: "Cette page n'est plus à jour. Rechargez-la, puis réessayez.",
      account_not_found: "Ce compte client n'existe plus.",
      company_not_found: "Cette entreprise n'existe plus.",
      contact_not_found: "Ce contact n'existe plus.",
      task_not_found: "Ce rappel n'existe plus.",
      task_closed: "Ce rappel est déjà terminé.",
      owner_not_found: "Cette personne ne fait pas partie de l'équipe Passalio.",
      contact_not_in_company: "Ce contact appartient à une autre entreprise.",
      already_in_team: "Cette personne fait déjà partie de l'équipe.",
      teammate_not_found: "Cette personne ne fait plus partie de l'équipe.",
      cannot_change_own_role: "Vous ne pouvez pas changer votre propre rôle.",
      invitation_email_mismatch:
        "Cette invitation a été envoyée à une autre adresse. Connectez-vous avec celle-ci.",
    },
  },
} as const;
