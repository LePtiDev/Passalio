const ALLOWED_HOSTS: readonly string[] = ["claude.ai", "claude.com"];

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]"]);

const isAllowedHost = (hostname: string) =>
  ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));

export const isAllowedRedirectUri = (redirectUri: string): boolean => {
  if (!URL.canParse(redirectUri)) {
    return false;
  }
  const { protocol, hostname } = new URL(redirectUri);
  if (LOOPBACK_HOSTS.has(hostname)) {
    return protocol === "http:" || protocol === "https:";
  }
  return protocol === "https:" && isAllowedHost(hostname);
};
