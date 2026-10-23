import { assertPlatformCan, err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type {
  AuthorizationError,
  AuthorizationGateway,
  DeniedConsent,
} from "../domain/authorization-ports";

export const denyAuthorization =
  (gateway: AuthorizationGateway) =>
  async (
    actor: PlatformActor,
    handle: string,
  ): Promise<Result<DeniedConsent, AuthorizationError>> => {
    assertPlatformCan(actor, "mcp:connect");
    const denied = await gateway.deny(handle);
    return denied === null ? err("authorization_expired") : ok(denied);
  };
