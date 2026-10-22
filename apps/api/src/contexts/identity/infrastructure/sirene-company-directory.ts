import { err, ok } from "@passalio/shared";
import * as z from "zod";
import type { Logger } from "../../../platform/logger";
import type { CompanySummary } from "../domain/company-summary";
import type { CompanyDirectory } from "../domain/identity-ports";

const SEARCH_URL = "https://recherche-entreprises.api.gouv.fr/search";
const RESULT_COUNT = "5";
const TIMEOUT_MS = 4000;

const establishmentSchema = z.object({
  siret: z.string(),
  adresse: z.string().nullable(),
  code_postal: z.string().nullable(),
  libelle_commune: z.string().nullable(),
});

const searchResponseSchema = z.object({
  results: z.array(
    z.object({
      nom_complet: z.string(),
      siege: establishmentSchema,
    }),
  ),
});

type SearchResponse = z.infer<typeof searchResponseSchema>;

const toCompanySummaries = ({ results }: SearchResponse): CompanySummary[] =>
  results.map(({ nom_complet: name, siege }) => ({
    name,
    siret: siege.siret,
    address: siege.adresse ?? "",
    postalCode: siege.code_postal ?? "",
    city: siege.libelle_commune ?? "",
  }));

export const createSireneCompanyDirectory = (
  logger: Logger,
  fetcher: typeof fetch = fetch,
): CompanyDirectory => ({
  search: async (query) => {
    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("per_page", RESULT_COUNT);
    url.searchParams.set("etat_administratif", "A");
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const parsed = searchResponseSchema.safeParse(response.ok ? await response.json() : null);
      if (!parsed.success) {
        logger.warn({ event: "company_search_failed", status: response.status });
        return err("company_search_unavailable");
      }
      return ok(toCompanySummaries(parsed.data));
    } catch {
      logger.warn({ event: "company_search_failed", status: 0 });
      return err("company_search_unavailable");
    }
  },
});
