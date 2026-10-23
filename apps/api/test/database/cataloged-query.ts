import type { Repositories } from "./repositories";
import type { Seeded } from "./seed";

export type CatalogedQuery = {
  readonly method: string;
  readonly query: string;
  readonly run: (repositories: Repositories, seeded: Seeded) => Promise<unknown>;
};

export const PAGE = 20;
