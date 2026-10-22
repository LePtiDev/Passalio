export const fr = {
  app: {
    name: "Passalio",
    tagline: "Chaque passage, en règle.",
    team: "Équipe",
    signOut: "Se déconnecter",
  },
  home: {
    title: "Bienvenue",
    subtitle: "Vos attestations, signées sur place, même sans réseau.",
    teamLink: "Gérer votre équipe",
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
      invitation_email_mismatch:
        "Cette invitation a été envoyée à une autre adresse. Connectez-vous avec celle-ci.",
    },
  },
} as const;
