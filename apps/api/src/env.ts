import type { Logger } from "./platform/logger";

export type Bindings = {
  readonly DB: D1Database;
  readonly FILES: R2Bucket;
};

export type Variables = {
  readonly traceId: string;
  readonly logger: Logger;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
