import { app } from "./app";
import type { Bindings } from "./env";

const worker: ExportedHandler<Bindings> = {
  fetch: (request, env, executionContext) => app.fetch(request, env, executionContext),
};

export default worker;
