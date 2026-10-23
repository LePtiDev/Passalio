import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";
import { readOfflineSession, rememberOfflineSession, type OfflineSession } from "./offline-session";

export const SIGN_IN_PATH = "/connexion";
export const SIGN_UP_PATH = "/inscription";
export const SIGN_IN_CODE_PATH = "/connexion/code";
export const ADMIN_PATH = "/admin";
export const ADMIN_CODE_PATH = "/admin/code";
export const ADMIN_SECURITY_PATH = "/admin/securite";
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

const activateFirstOrganization = async (
  activeOrganizationId: string | null | undefined,
): Promise<string | null> => {
  if (activeOrganizationId) {
    return activeOrganizationId;
  }
  const { data: organizations } = await authClient.organization.list();
  const first = organizations?.[0];
  if (first === undefined) {
    return null;
  }
  await authClient.organization.setActive({ organizationId: first.id });
  return first.id;
};

export const loadOrganizationState = async (returnTo: string) => {
  const session = await requireSession(returnTo);
  const organizationId = await activateFirstOrganization(session.session.activeOrganizationId);
  return { session, organizationId, hasOrganization: organizationId !== null };
};

export const ensureActiveOrganization = async (returnTo: string) => {
  const { session, organizationId } = await loadOrganizationState(returnTo);
  if (organizationId === null) {
    throw redirect({ to: COMPANY_SETUP_PATH });
  }
  return { ...session, organizationId };
};

const fetchSession = async () => {
  if (!navigator.onLine) {
    return { isReachable: false, data: null };
  }
  try {
    const { data, error } = await authClient.getSession();
    return { isReachable: error === null, data };
  } catch {
    return { isReachable: false, data: null };
  }
};

export const loadSignedInSession = async (returnTo: string): Promise<OfflineSession> => {
  const fetched = await fetchSession();
  const remembered = readOfflineSession();
  if (!fetched.isReachable && remembered !== undefined) {
    return remembered;
  }
  if (fetched.data === null) {
    throw redirect({ to: SIGN_IN_PATH, search: { retour: returnTo } });
  }
  const { user } = fetched.data;
  const organizationId = await activateFirstOrganization(fetched.data.session.activeOrganizationId);
  if (organizationId === null) {
    throw redirect({ to: COMPANY_SETUP_PATH });
  }
  const session = { userId: user.id, name: user.name, email: user.email, organizationId };
  rememberOfflineSession(session);
  return session;
};
