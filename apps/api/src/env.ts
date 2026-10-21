export type Bindings = {
  readonly DB: D1Database;
};

export type Variables = {
  readonly traceId: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
