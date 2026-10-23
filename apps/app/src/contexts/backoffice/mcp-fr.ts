import type { McpAccessLevel } from "@passalio/shared";

export const MCP_ACCESS_LABELS: Readonly<Record<McpAccessLevel, string>> = {
  read: "Lecture seule",
  write: "Lecture et écriture",
};

export const MCP_ACCESS_DESCRIPTIONS: Readonly<Record<McpAccessLevel, string>> = {
  read: "Voir la vue d'ensemble, les comptes clients, le journal et la prospection.",
  write:
    "En plus, créer et modifier les entreprises prospectées, les contacts, les étapes et les notes. Jamais de suppression.",
};

export const mcpFr = {
  showcaseBadge: "Espace admin",
  showcaseTitle: "Claude agit avec vos droits. Chaque écriture est protégée et journalisée.",
  title: "Autoriser Claude à accéder à Passalio",
  text: (email: string) =>
    `Claude demande l'accès à l'espace admin avec votre compte ${email}. Il agira avec vos droits.`,
  requestedBy: "Demandé par",
  returnTo: (host: string) => `Retour vers ${host}`,
  loopbackWarning:
    "Retour vers une application de cet ordinateur. Autorisez seulement si vous venez de la lancer.",
  accessLegend: "Ce que Claude pourra faire",
  footnote:
    "Chaque écriture apparaît dans le Journal. L'accès dure 7 jours, ensuite Claude vous redemandera votre code.",
  deny: "Refuser",
  approve: "Autoriser",
  approving: "Un instant…",
  grantedTitle: "Claude est connecté",
  grantedText: (access: string, until: string) =>
    `Accès en ${access.toLowerCase()} jusqu'au ${until}. Retour vers Claude…`,
  backToClaude: "Revenir dans Claude",
  toAdmin: "Aller à l'espace admin",
  invalidTitle: "Cette demande n'est plus valable",
  invalidText:
    "Elle a expiré, a déjà servi, ou ne revient pas vers une adresse autorisée (claude.ai, claude.com). Relancez la connexion depuis Claude.",
  errorTitle: "Impossible de charger la demande",
  errorText: "Vérifiez votre connexion, puis réessayez.",
  errorCode: (code: string) => ` Si le problème continue, donnez ce code au support : ${code}.`,
  retry: "Réessayer",
} as const;
