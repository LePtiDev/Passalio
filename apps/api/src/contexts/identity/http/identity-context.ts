import type { Actor } from "@passalio/shared";
import type { Bindings, Variables } from "../../../env";
import type { UserActor } from "../domain/identity-models";
import type { IdentityDependencies } from "../domain/identity-ports";
import { createIdentityDependencies } from "../infrastructure/identity-dependencies";

export const identityDependencies = (
  variables: Variables,
  bindings: Bindings,
): IdentityDependencies =>
  createIdentityDependencies({
    database: variables.database,
    auditTrail: variables.auditTrail,
    emailSender: variables.emailSender,
    files: bindings.FILES,
    logger: variables.logger,
    appUrl: bindings.APP_URL,
  });

export const currentUserActor = ({ session }: Variables): UserActor | undefined =>
  session === null
    ? undefined
    : {
        userId: session.user.id,
        email: session.user.email,
        isImpersonating: Boolean(session.session.impersonatedBy),
      };

export const currentActor = async (
  variables: Variables,
  bindings: Bindings,
): Promise<Actor | undefined> => {
  const { session } = variables;
  const organizationId = session?.session.activeOrganizationId;
  if (session === null || organizationId === null || organizationId === undefined) {
    return undefined;
  }
  const member = await identityDependencies(variables, bindings).members.findByUserId(
    organizationId,
    session.user.id,
  );
  if (member === undefined) {
    return undefined;
  }
  return {
    userId: session.user.id,
    organizationId,
    role: member.role,
    isImpersonating: Boolean(session.session.impersonatedBy),
  };
};
