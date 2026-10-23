export type PendingAuthorization = {
  readonly clientName: string;
  readonly redirectUri: string;
  readonly redirectHost: string;
  readonly isLoopback: boolean;
  readonly codeChallengeMethod: string | undefined;
};

export type ConsentStart = {
  readonly handle: string;
  readonly headers: Headers;
};

export type ApprovedConsent = {
  readonly clientName: string;
  readonly redirectUri: string;
  readonly complete: (userId: string) => Promise<string>;
  readonly headers: Headers;
};

export type DeniedConsent = {
  readonly redirectTo: string;
  readonly headers: Headers;
};

export type AuthorizationGateway = {
  readonly read: () => Promise<PendingAuthorization | null>;
  readonly begin: () => Promise<ConsentStart>;
  readonly approve: (handle: string, scopes: string[]) => Promise<ApprovedConsent | null>;
  readonly deny: (handle: string) => Promise<DeniedConsent | null>;
};

export type AuthorizationAudit = {
  readonly authorized: (actorUserId: string, clientName: string, access: string) => Promise<void>;
};

export type AuthorizationError =
  | "authorization_invalid"
  | "authorization_expired"
  | "redirect_not_allowed"
  | "pkce_required";
