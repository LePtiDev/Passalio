import type { TestPlatform } from "../test-platform";
import { COMPANY_ROUTE_SAMPLES } from "./company-route-samples";
import { PLATFORM_ROUTE_SAMPLES } from "./platform-route-samples";
import { routeKey, type SessionRoute } from "./route-declarations";
import type { SampleIds } from "./sample-request";

const ROUTE_SAMPLES = { ...COMPANY_ROUTE_SAMPLES, ...PLATFORM_ROUTE_SAMPLES };

export const SAMPLED_ROUTE_KEYS: readonly string[] = Object.keys(ROUTE_SAMPLES);

export const sampleOf = (route: SessionRoute, ids: SampleIds) => {
  const builder = ROUTE_SAMPLES[routeKey(route)];
  if (builder === undefined) {
    throw new Error(`No sample request declared for ${routeKey(route)}`);
  }
  return builder(ids);
};

export const sendSample = (
  platform: TestPlatform,
  route: SessionRoute,
  ids: SampleIds,
  cookie?: string,
) => {
  const { path, init } = sampleOf(route, ids);
  return platform.request(path, init, cookie);
};
