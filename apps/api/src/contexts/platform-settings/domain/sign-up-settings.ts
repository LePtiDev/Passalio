export type SignUpSettings = {
  readonly isSignUpOpen: boolean;
  readonly changedAt: Date | null;
  readonly changedByName: string | null;
};

export const DEFAULT_SIGN_UP_SETTINGS: SignUpSettings = {
  isSignUpOpen: true,
  changedAt: null,
  changedByName: null,
};

export const isSignUpAllowed = (
  { isSignUpOpen }: Pick<SignUpSettings, "isSignUpOpen">,
  hasPendingInvitation: boolean,
): boolean => isSignUpOpen || hasPendingInvitation;

export const normalizeSignUpEmail = (email: string): string => email.trim().toLowerCase();
