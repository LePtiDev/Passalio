import {
  AuthorizationError,
  type AuthRequest,
  type OAuthHelpers,
} from "@cloudflare/workers-oauth-provider";
import type { AuthorizationGateway } from "../domain/authorization-ports";
import { AUTHORIZE_PATH } from "./oauth-servers";

const NO_PROPS = {};

const consumedOrNull = async <Value>(run: () => Promise<Value>): Promise<Value | null> => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return null;
    }
    throw error;
  }
};

const clientNameOf = async (helpers: OAuthHelpers, clientId: string) =>
  (await helpers.lookupClient(clientId))?.clientName?.trim() || clientId;

export const createOAuthAuthorizationGateway = (
  helpers: OAuthHelpers,
  request: Request,
  appUrl: string,
): AuthorizationGateway => {
  const authorizeRequest = new Request(`${appUrl}${AUTHORIZE_PATH}${new URL(request.url).search}`);
  let parsed: AuthRequest | undefined;
  return {
    read: async () => {
      try {
        parsed = await helpers.parseAuthRequest(authorizeRequest);
        const consent = await helpers.describeConsent(parsed);
        return {
          clientName: consent.clientName,
          redirectUri: consent.redirectUri,
          redirectHost: consent.redirectHost,
          isLoopback: consent.redirectIsLoopback,
          codeChallengeMethod: parsed.codeChallengeMethod,
        };
      } catch {
        return null;
      }
    },
    begin: async () => {
      if (parsed === undefined) {
        throw new Error("authorization_not_read");
      }
      return helpers.beginConsent(parsed);
    },
    approve: async (handle, scopes) =>
      consumedOrNull(async () => {
        const approved = await helpers.approveConsent(request, handle, { scope: scopes });
        const clientName = await clientNameOf(helpers, approved.request.clientId);
        return {
          clientName,
          redirectUri: approved.request.redirectUri,
          headers: approved.headers,
          complete: async (userId: string) =>
            (
              await helpers.completeAuthorization({
                request: approved.request,
                userId,
                metadata: { clientName },
                scope: approved.request.scope,
                props: NO_PROPS,
              })
            ).redirectTo,
        };
      }),
    deny: async (handle) =>
      consumedOrNull(async () => {
        const denied = await helpers.denyConsent(request, handle);
        return { redirectTo: denied.redirectTo, headers: denied.headers };
      }),
  };
};
