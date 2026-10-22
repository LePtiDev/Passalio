import {
  assertCan,
  err,
  LOGO_CONTENT_TYPES,
  LOGO_MAX_BYTES,
  ok,
  type Actor,
  type Result,
} from "@passalio/shared";
import type { IdentityError } from "../domain/identity-error";
import type { IdentityDependencies } from "../domain/identity-ports";

export type LogoUpload = {
  readonly body: ArrayBuffer;
  readonly contentType: string;
};

const isAcceptedContentType = (contentType: string) =>
  LOGO_CONTENT_TYPES.some((accepted) => accepted === contentType);

export const logoKey = (organizationId: string) => `organizations/${organizationId}/logo`;

export const uploadOrganizationLogo =
  ({
    organizations,
    logoStorage,
    auditTrail,
  }: Pick<IdentityDependencies, "organizations" | "logoStorage" | "auditTrail">) =>
  async (actor: Actor, upload: LogoUpload): Promise<Result<void, IdentityError>> => {
    assertCan(actor, "organization:update");
    if (
      !isAcceptedContentType(upload.contentType) ||
      upload.body.byteLength === 0 ||
      upload.body.byteLength > LOGO_MAX_BYTES
    ) {
      return err("invalid_logo");
    }
    const key = logoKey(actor.organizationId);
    await logoStorage.put(key, upload.body, upload.contentType);
    await organizations.setLogoKey(actor.organizationId, key);
    await auditTrail.record({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "organization.logo_updated",
      targetType: "organization",
      targetId: actor.organizationId,
    });
    return ok(undefined);
  };
