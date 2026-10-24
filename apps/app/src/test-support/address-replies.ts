import { jsonReply, type FakeReply } from "./fake-api";

export const ADDRESS_SEARCH_ROUTE = "GET /geocodage/search";

type AddressFeature = {
  readonly id: string;
  readonly name: string;
  readonly postcode: string;
  readonly city: string;
};

export const addressSearchReply = (features: readonly AddressFeature[] = []): FakeReply =>
  jsonReply({
    features: features.map((properties) => ({
      geometry: { coordinates: [2.38, 48.81] },
      properties,
    })),
  });
