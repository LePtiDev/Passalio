import { useQuery } from "@tanstack/react-query";
import * as z from "zod";

const ADDRESS_SEARCH_URL = "https://data.geopf.fr/geocodage/search";
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 5;

const searchResponse = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      properties: z.object({
        id: z.string(),
        name: z.string(),
        postcode: z.string(),
        city: z.string(),
      }),
    }),
  ),
});

export type AddressSuggestion = {
  readonly id: string;
  readonly address: string;
  readonly postalCode: string;
  readonly city: string;
  readonly latitude: number;
  readonly longitude: number;
};

const searchAddresses = async (
  query: string,
  signal: AbortSignal,
): Promise<AddressSuggestion[]> => {
  const params = new URLSearchParams({ q: query, limit: String(RESULT_LIMIT), index: "address" });
  const response = await fetch(`${ADDRESS_SEARCH_URL}?${params.toString()}`, { signal });
  const parsed = searchResponse.parse(await response.json());
  return parsed.features.map(({ geometry, properties }) => ({
    id: properties.id,
    address: properties.name,
    postalCode: properties.postcode,
    city: properties.city,
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  }));
};

export const useAddressSearch = (query: string, isEnabled: boolean) => {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["address-search", trimmed],
    queryFn: ({ signal }) => searchAddresses(trimmed, signal),
    enabled: isEnabled && trimmed.length >= MIN_QUERY_LENGTH && navigator.onLine,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
};
