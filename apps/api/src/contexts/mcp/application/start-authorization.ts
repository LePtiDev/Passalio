import { assertPlatformCan, err, ok, type PlatformActor, type Result } from "@passalio/shared";
import type {
  AuthorizationError,
  AuthorizationGateway,
  ConsentStart,
  PendingAuthorization,
} from "../domain/authorization-ports";
import { isAllowedRedirectUri } from "../domain/redirect-policy";

const PKCE_METHOD = "S256";

export type StartedAuthorization = {
  readonly pending: PendingAuthorization;
  readonly consent: ConsentStart;
};

export const startAuthorization =
  (gateway: AuthorizationGateway) =>
  async (actor: PlatformActor): Promise<Result<StartedAuthorization, AuthorizationError>> => {
    assertPlatformCan(actor, "mcp:connect");
    const pending = await gateway.read();
    if (pending === null) {
      return err("authorization_invalid");
    }
    if (!isAllowedRedirectUri(pending.redirectUri)) {
      return err("redirect_not_allowed");
    }
    if (pending.codeChallengeMethod !== PKCE_METHOD) {
      return err("pkce_required");
    }
    return ok({ pending, consent: await gateway.begin() });
  };
