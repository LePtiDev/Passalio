export const NETWORK_ONLY_NAVIGATIONS: readonly RegExp[] = [
  /^\/api\//,
  /^\/health$/,
  /^\/mcp$/,
  /^\/oauth\//,
  /^\/\.well-known\//,
  /^\/admin\/mcp\//,
];

export const isServedByNetworkOnly = (path: string) =>
  NETWORK_ONLY_NAVIGATIONS.some((pattern) => pattern.test(path));
