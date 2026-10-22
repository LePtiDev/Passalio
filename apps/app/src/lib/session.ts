import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

export const SIGN_IN_PATH = "/connexion";
export const SIGN_UP_PATH = "/inscription";
export const FORGOT_PASSWORD_PATH = "/mot-de-passe-oublie";
export const RESET_PASSWORD_PATH = "/mot-de-passe/nouveau";

export const loadSession = async () => {
  const { data } = await authClient.getSession();
  return data;
};

export const requireSession = async (returnTo: string) => {
  const session = await loadSession();
  if (session === null) {
    throw redirect({ to: SIGN_IN_PATH, search: { retour: returnTo } });
  }
  return session;
};

export const COMPANY_SETUP_PATH = "/configuration/entreprise";

const activateFirstOrganization = async (activeOrganizationId: string | null | undefined) => {
  if (activeOrganizationId) {
    return true;
  }
  const { data: organizations } = await authClient.organization.list();
  const first = organizations?.[0];
  if (first === undefined) {
    return false;
  }
  await authClient.organization.setActive({ organizationId: first.id });
  return true;
};

export const loadOrganizationState = async (returnTo: string) => {
  const session = await requireSession(returnTo);
  const hasOrganization = await activateFirstOrganization(session.session.activeOrganizationId);
  return { session, hasOrganization };
};

export const ensureActiveOrganization = async (returnTo: string) => {
  const { session, hasOrganization } = await loadOrganizationState(returnTo);
  if (!hasOrganization) {
    throw redirect({ to: COMPANY_SETUP_PATH });
  }
  return session;
};
