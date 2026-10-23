import type { ImportedCompany } from "./prospect-rows.ts";

const GEOCODER_URL = "https://data.geopf.fr/geocodage/search";
const MIN_ADDRESS_SCORE = 0.5;
const CONCURRENCY = 5;

export type Position = { readonly latitude: number; readonly longitude: number };

const firstPositionOf = (body: unknown, minScore: number): Position | null => {
  if (typeof body !== "object" || body === null || !("features" in body)) {
    return null;
  }
  const { features } = body;
  if (!Array.isArray(features)) {
    return null;
  }
  const [feature]: unknown[] = features;
  if (
    typeof feature !== "object" ||
    feature === null ||
    !("geometry" in feature) ||
    !("properties" in feature)
  ) {
    return null;
  }
  const { geometry, properties } = feature;
  const coordinates: unknown =
    typeof geometry === "object" && geometry !== null && "coordinates" in geometry
      ? geometry.coordinates
      : null;
  const score: unknown =
    typeof properties === "object" && properties !== null && "score" in properties
      ? properties.score
      : 0;
  if (!Array.isArray(coordinates) || typeof score !== "number" || score < minScore) {
    return null;
  }
  const [longitude, latitude]: unknown[] = coordinates;
  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : null;
};

const search = async (parameters: Record<string, string>, minScore: number) => {
  const url = `${GEOCODER_URL}?${new URLSearchParams({ ...parameters, limit: "1" })}`;
  try {
    const response = await fetch(url);
    return response.ok ? firstPositionOf(await response.json(), minScore) : null;
  } catch {
    return null;
  }
};

export const geocode = async (company: ImportedCompany): Promise<Position | null> => {
  const area = [company.postalCode, company.city].filter((part) => part !== null).join(" ");
  if (company.address !== null && area !== "") {
    const position = await search({ q: `${company.address} ${area}` }, MIN_ADDRESS_SCORE);
    if (position !== null) {
      return position;
    }
  }
  return company.city === null
    ? null
    : search(
        {
          q: company.city,
          type: "municipality",
          ...(company.postalCode === null ? {} : { postcode: company.postalCode }),
        },
        0,
      );
};

type Located = { readonly id: string; readonly position: Position | null };

export const geocodeAll = async (
  companies: readonly ImportedCompany[],
): Promise<ReadonlyMap<string, Position>> => {
  const batches = Array.from({ length: Math.ceil(companies.length / CONCURRENCY) }, (_, index) =>
    companies.slice(index * CONCURRENCY, (index + 1) * CONCURRENCY),
  );
  const located = await batches.reduce<Promise<readonly Located[]>>(
    async (previous, batch) => [
      ...(await previous),
      ...(await Promise.all(
        batch.map(async (company) => ({ id: company.id, position: await geocode(company) })),
      )),
    ],
    Promise.resolve([]),
  );
  return new Map<string, Position>(
    located.flatMap(({ id, position }): [string, Position][] =>
      position === null ? [] : [[id, position]],
    ),
  );
};
