import { err, isPlatformRole, ok, type PlatformActor, type Result } from "@passalio/shared";

export const TWO_FACTOR_PROOF_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type AdminAccessDenial = "not_admin" | "two_factor_required" | "two_factor_unverified";

export type AdminSessionFacts = {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string | null | undefined;
  readonly isTwoFactorEnabled: boolean;
  readonly isImpersonating: boolean;
  readonly isBanned: boolean;
  readonly twoFactorVerifiedAt: Date | null;
};

export const evaluateAdminAccess = (
  facts: AdminSessionFacts,
  now: Date,
): Result<PlatformActor, AdminAccessDenial> => {
  if (!isPlatformRole(facts.role) || facts.isImpersonating || facts.isBanned) {
    return err("not_admin");
  }
  if (!facts.isTwoFactorEnabled) {
    return err("two_factor_required");
  }
  if (
    facts.twoFactorVerifiedAt === null ||
    now.getTime() - facts.twoFactorVerifiedAt.getTime() > TWO_FACTOR_PROOF_MAX_AGE_MS
  ) {
    return err("two_factor_unverified");
  }
  return ok({ userId: facts.userId, email: facts.email, name: facts.name, role: facts.role });
};
