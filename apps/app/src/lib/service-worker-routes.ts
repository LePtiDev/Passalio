export const NETWORK_ONLY_NAVIGATIONS: readonly RegExp[] = [];

export const isServedByNetworkOnly = (path: string) =>
  NETWORK_ONLY_NAVIGATIONS.some((pattern) => pattern.test(path));
